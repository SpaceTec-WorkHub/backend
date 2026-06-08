import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateCarpoolTripDto } from './dto/create-carpool_trip.dto';
import { UpdateCarpoolTripDto } from './dto/update-carpool_trip.dto';
import {
  CarpoolTrip,
  CarpoolTripStatus,
} from './entities/carpool_trip.entity';
import { TripRider, TripRiderStatus } from './entities/trip_rider.entity';
import { User } from '../user/entities/user.entity';
import { Vehicle } from '../vehicle/entities/vehicle.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationReason } from '../notifications/entities/notification.entity';

const CARPOOL_TIME_ZONE = 'America/Monterrey';

@Injectable()
export class CarpoolTripService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(CarpoolTrip)
    private readonly carpoolTripRepository: Repository<CarpoolTrip>,
    @InjectRepository(TripRider)
    private readonly tripRiderRepository: Repository<TripRider>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async sendCarpoolNotification(params: {
    userId: number;
    reason: NotificationReason;
    title: string;
    content: string;
  }) {
    try {
      await this.notificationsService.create({
        user_id: params.userId,
        reason: params.reason,
        title: params.title,
        content: params.content,
      });
    } catch (error) {
      console.error('[CARPOOL NOTIFICATION ERROR]', error);
    }
  }

  private async notifyRiders(
    riders: TripRider[],
    reason: NotificationReason,
    title: string,
    content: string,
  ) {
    for (const rider of riders) {
      await this.sendCarpoolNotification({ userId: rider.user_id, reason, title, content });
    }
  }

  private formatTripDateTime(value?: Date | string | null) {
    if (!value) {
      return 'Horario no disponible';
    }

    const parsedValue = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(parsedValue.getTime())) {
      return 'Horario no disponible';
    }

    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: CARPOOL_TIME_ZONE,
    }).format(parsedValue);
  }

  private buildTripSummary(trip: CarpoolTrip) {
    const dateLabel = this.formatTripDateTime(trip.trip_date);
    const meetingPointLabel = trip.meeting_point
      ? ` Punto de encuentro: ${trip.meeting_point}.`
      : '';

    return `Viaje de ${trip.origin} a ${trip.destination} el ${dateLabel}.${meetingPointLabel}`;
  }

  async create(createCarpoolTripDto: CreateCarpoolTripDto) {
    const driver = await this.userRepository.findOne({
      where: { user_id: createCarpoolTripDto.driver_id },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const vehicle = await this.vehicleRepository.findOne({
      where: { vehicle_id: createCarpoolTripDto.vehicle_id },
      relations: ['owner'],
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (vehicle.owner_id !== driver.user_id) {
      throw new BadRequestException('Vehicle must belong to the selected driver');
    }

    // The driver occupies one of the vehicle's seats, so only the rest can be offered to riders.
    const seatsForRiders = Math.max(vehicle.seats_total - 1, 0);

    const { seats_total: _ignoredSeatsTotal, departure_time, ...rest } =
      createCarpoolTripDto;

    const trip = this.carpoolTripRepository.create({
      ...rest,
      trip_date: new Date(createCarpoolTripDto.trip_date),
      departure_time: departure_time ? new Date(departure_time) : undefined,
      seats_total: seatsForRiders,
      seats_available: seatsForRiders,
      status: createCarpoolTripDto.status ?? CarpoolTripStatus.OPEN,
      driver,
      vehicle,
    });

    return this.carpoolTripRepository.save(trip);
  }

  async findAll() {
    return this.carpoolTripRepository.find({
      relations: ['driver', 'vehicle', 'tripRiders', 'tripRiders.user'],
      order: { trip_date: 'ASC' },
    });
  }

  async findOne(id: number) {
    const trip = await this.carpoolTripRepository.findOne({
      where: { trip_id: id },
      relations: ['driver', 'vehicle', 'tripRiders', 'tripRiders.user'],
    });

    if (!trip) {
      throw new NotFoundException('Carpool trip not found');
    }

    return trip;
  }

  async update(id: number, updateCarpoolTripDto: UpdateCarpoolTripDto) {
    const trip = await this.findOne(id);
    const { trip_date, driver_id, seats_total, status, ...rest } =
      updateCarpoolTripDto;

    if (driver_id) {
      const driver = await this.userRepository.findOne({
        where: { user_id: driver_id },
      });

      if (!driver) {
        throw new NotFoundException('Driver not found');
      }

      trip.driver = driver;
      trip.driver_id = driver.user_id;
    }

    if (updateCarpoolTripDto.vehicle_id) {
      const vehicle = await this.vehicleRepository.findOne({
        where: { vehicle_id: updateCarpoolTripDto.vehicle_id },
        relations: ['owner'],
      });

      if (!vehicle) {
        throw new NotFoundException('Vehicle not found');
      }

      if (trip.driver_id && vehicle.owner_id !== trip.driver_id) {
        throw new BadRequestException(
          'Vehicle must belong to the selected driver',
        );
      }

      if (trip.driver_id && vehicle.owner_id !== trip.driver_id) {
        throw new BadRequestException(
          'Vehicle must belong to the selected driver',
        );
      }

      trip.vehicle = vehicle;
      trip.vehicle_id = vehicle.vehicle_id;

      if (seats_total === undefined && trip.seats_total > vehicle.seats_total) {
        throw new BadRequestException(
          'Trip seats_total cannot exceed vehicle capacity',
        );
      }
    }

    if (trip_date) {
      trip.trip_date = new Date(trip_date);
    }

    Object.assign(trip, {
      ...rest,
      status: status ?? trip.status,
    });

    if (seats_total !== undefined) {
      const maxCapacity = trip.vehicle?.seats_total ?? trip.seats_total;

      if (seats_total > maxCapacity) {
        throw new BadRequestException(
          'Trip seats_total cannot exceed vehicle capacity',
        );
      }

      const acceptedRiders = trip.tripRiders.filter(
        (tripRider) =>
          tripRider.status === TripRiderStatus.ACCEPTED ||
          tripRider.status === TripRiderStatus.BOARDED,
      ).length;

      if (seats_total < acceptedRiders) {
        throw new BadRequestException(
          'seats_total cannot be lower than current accepted riders',
        );
      }

      trip.seats_available = seats_total - acceptedRiders;
      trip.seats_total = seats_total;
      if (trip.seats_available > 0 && trip.status === CarpoolTripStatus.FULL) {
        trip.status = CarpoolTripStatus.OPEN;
      }
    }

    return this.carpoolTripRepository.save(trip);
  }

  async remove(id: number) {
    const trip = await this.findOne(id);
    return this.carpoolTripRepository.softRemove(trip);
  }

  async addRider(tripId: number, userId: number) {
    return this.dataSource.transaction(async (manager) => {
      const tripRepository = manager.getRepository(CarpoolTrip);
      const riderRepository = manager.getRepository(TripRider);
      const userRepository = manager.getRepository(User);

      const trip = await tripRepository.findOne({
        where: { trip_id: tripId },
        relations: ['driver', 'tripRiders'],
      });

      if (!trip) {
        throw new NotFoundException('Carpool trip not found');
      }

      if (trip.driver_id === userId) {
        throw new BadRequestException('Driver cannot join as rider');
      }

      const user = await userRepository.findOne({
        where: { user_id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const existing = await riderRepository.findOne({
        where: { trip_id: tripId, user_id: userId },
      });

      if (existing) {
        throw new BadRequestException('User is already associated with this trip');
      }

      if (trip.seats_available <= 0) {
        throw new BadRequestException('No seats available');
      }

      const activeRiderEntry = await riderRepository
        .createQueryBuilder('rider')
        .innerJoin('rider.trip', 'activeTrip')
        .where('rider.user_id = :userId', { userId })
        .andWhere('rider.status IN (:...riderStatuses)', {
          riderStatuses: [
            TripRiderStatus.REQUESTED,
            TripRiderStatus.ACCEPTED,
            TripRiderStatus.BOARDED,
          ],
        })
        .andWhere('activeTrip.status NOT IN (:...tripStatuses)', {
          tripStatuses: [
            CarpoolTripStatus.COMPLETED,
            CarpoolTripStatus.CANCELLED,
          ],
        })
        .getOne();

      if (activeRiderEntry) {
        throw new BadRequestException(
          'Ya tienes una solicitud de viaje en curso. Debes esperar a que termine antes de solicitar otro.',
        );
      }

      const tripRider = riderRepository.create({
        trip,
        user,
        trip_id: trip.trip_id,
        user_id: user.user_id,
        status: TripRiderStatus.REQUESTED,
      });

      // Reserve the seat immediately while the request is pending the driver's confirmation.
      trip.seats_available -= 1;
      trip.status =
        trip.seats_available === 0 ? CarpoolTripStatus.FULL : trip.status;

      await tripRepository.save(trip);
      const savedRider = await riderRepository.save(tripRider);

      await this.sendCarpoolNotification({
        userId: trip.driver_id,
        reason: NotificationReason.CARPOOL_ALERT,
        title: 'Nueva solicitud para tu viaje',
        content: `${user.full_name ?? 'Un usuario'} quiere unirse a tu viaje. ${this.buildTripSummary(trip)} Ve a "Mis viajes" para aceptar o rechazar la solicitud.`,
      });

      return savedRider;
    });
  }

  async removeRider(tripId: number, userId: number) {
    return this.dataSource.transaction(async (manager) => {
      const tripRepository = manager.getRepository(CarpoolTrip);
      const riderRepository = manager.getRepository(TripRider);

      const trip = await tripRepository.findOne({
        where: { trip_id: tripId },
        relations: ['tripRiders', 'driver'],
      });

      if (!trip) {
        throw new NotFoundException('Carpool trip not found');
      }

      const rider = await riderRepository.findOne({
        where: { trip_id: tripId, user_id: userId },
        relations: ['user'],
      });

      if (!rider) {
        throw new NotFoundException('Rider not found in this trip');
      }

      const wasActiveRequest = [
        TripRiderStatus.REQUESTED,
        TripRiderStatus.ACCEPTED,
        TripRiderStatus.BOARDED,
      ].includes(rider.status);

      await riderRepository.delete({ trip_id: tripId, user_id: userId });

      trip.seats_available += 1;
      if (trip.status === CarpoolTripStatus.FULL) {
        trip.status = CarpoolTripStatus.OPEN;
      }

      const savedTrip = await tripRepository.save(trip);

      if (wasActiveRequest) {
        await this.sendCarpoolNotification({
          userId: trip.driver_id,
          reason: NotificationReason.CARPOOL_MEMBER_REMOVED,
          title: 'Un pasajero canceló su solicitud',
          content: `${rider.user?.full_name ?? 'Un pasajero'} canceló su solicitud para tu viaje. ${this.buildTripSummary(trip)} El asiento quedó disponible de nuevo.`,
        });
      }

      return savedTrip;
    });
  }

  async findByDriver(driverId: number) {
    return this.carpoolTripRepository.find({
      where: { driver_id: driverId },
      relations: ['driver', 'vehicle', 'tripRiders', 'tripRiders.user'],
      order: { trip_date: 'DESC' },
    });
  }

  async acceptRider(tripId: number, userId: number, driverId: number) {
    return this.dataSource.transaction(async (manager) => {
      const tripRepository = manager.getRepository(CarpoolTrip);
      const riderRepository = manager.getRepository(TripRider);

      const trip = await tripRepository.findOne({
        where: { trip_id: tripId },
        relations: ['driver'],
      });
      if (!trip) {
        throw new NotFoundException('Carpool trip not found');
      }
      this.assertIsDriver(trip, driverId);

      const rider = await riderRepository.findOne({
        where: { trip_id: tripId, user_id: userId },
      });
      if (!rider) {
        throw new NotFoundException('Rider not found in this trip');
      }
      if (rider.status !== TripRiderStatus.REQUESTED) {
        throw new BadRequestException('Only pending requests can be accepted');
      }

      rider.status = TripRiderStatus.ACCEPTED;
      rider.responded_at = new Date();
      rider.joined_at = new Date();

      const savedRider = await riderRepository.save(rider);

      await this.sendCarpoolNotification({
        userId: rider.user_id,
        reason: NotificationReason.CARPOOL_TRIP_CONFIRMED,
        title: 'Tu solicitud de viaje fue aceptada',
        content: `${trip.driver?.full_name ?? 'El conductor'} aceptó tu solicitud y confirmó tu lugar en el viaje. ${this.buildTripSummary(trip)}`,
      });

      return savedRider;
    });
  }

  async rejectRider(tripId: number, userId: number, driverId: number) {
    return this.dataSource.transaction(async (manager) => {
      const tripRepository = manager.getRepository(CarpoolTrip);
      const riderRepository = manager.getRepository(TripRider);

      const trip = await tripRepository.findOne({
        where: { trip_id: tripId },
        relations: ['driver'],
      });
      if (!trip) {
        throw new NotFoundException('Carpool trip not found');
      }
      this.assertIsDriver(trip, driverId);

      const rider = await riderRepository.findOne({
        where: { trip_id: tripId, user_id: userId },
      });
      if (!rider) {
        throw new NotFoundException('Rider not found in this trip');
      }
      if (rider.status !== TripRiderStatus.REQUESTED) {
        throw new BadRequestException('Only pending requests can be rejected');
      }

      rider.status = TripRiderStatus.REJECTED;
      rider.responded_at = new Date();

      // The seat reserved while the request was pending becomes available again.
      trip.seats_available += 1;
      if (trip.status === CarpoolTripStatus.FULL) {
        trip.status = CarpoolTripStatus.OPEN;
      }

      await tripRepository.save(trip);
      const savedRider = await riderRepository.save(rider);

      await this.sendCarpoolNotification({
        userId: rider.user_id,
        reason: NotificationReason.CARPOOL_MEMBER_REMOVED,
        title: 'Tu solicitud de viaje fue rechazada',
        content: `${trip.driver?.full_name ?? 'El conductor'} rechazó tu solicitud para este viaje. ${this.buildTripSummary(trip)} Tu lugar quedó liberado y puedes buscar otro viaje disponible.`,
      });

      return savedRider;
    });
  }

  async startTrip(tripId: number, driverId: number) {
    const trip = await this.findOne(tripId);
    this.assertIsDriver(trip, driverId);

    if (
      trip.status !== CarpoolTripStatus.OPEN &&
      trip.status !== CarpoolTripStatus.FULL
    ) {
      throw new BadRequestException('Only open or full trips can be started');
    }

    trip.status = CarpoolTripStatus.IN_PROGRESS;
    const savedTrip = await this.carpoolTripRepository.save(trip);

    const activeRiders = (trip.tripRiders ?? []).filter((rider) =>
      [TripRiderStatus.ACCEPTED, TripRiderStatus.BOARDED].includes(rider.status),
    );
    await this.notifyRiders(
      activeRiders,
      NotificationReason.CARPOOL_ALERT,
      'Tu viaje ya inició',
      `${trip.driver?.full_name ?? 'El conductor'} inició el recorrido y va en camino al punto de encuentro. ${this.buildTripSummary(trip)}`,
    );

    return savedTrip;
  }

  async confirmMeetingPoint(tripId: number, driverId: number) {
    const trip = await this.findOne(tripId);
    this.assertIsDriver(trip, driverId);

    if (trip.status !== CarpoolTripStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'The trip must be in progress to confirm the meeting point',
      );
    }
    if (trip.meeting_point_confirmed_at) {
      throw new BadRequestException('The meeting point was already confirmed');
    }

    trip.meeting_point_confirmed_at = new Date();
    const savedTrip = await this.carpoolTripRepository.save(trip);

    const activeRiders = (trip.tripRiders ?? []).filter((rider) =>
      [TripRiderStatus.ACCEPTED, TripRiderStatus.BOARDED].includes(rider.status),
    );
    await this.notifyRiders(
      activeRiders,
      NotificationReason.CARPOOL_ALERT,
      'El conductor llegó al punto de encuentro',
      `${trip.driver?.full_name ?? 'El conductor'} confirmó que llegó al punto de encuentro${trip.meeting_point ? ` (${trip.meeting_point})` : ''} y el viaje continúa hacia el destino. ${this.buildTripSummary(trip)}`,
    );

    return savedTrip;
  }

  async completeTrip(tripId: number, driverId: number) {
    return this.dataSource.transaction(async (manager) => {
      const tripRepository = manager.getRepository(CarpoolTrip);
      const riderRepository = manager.getRepository(TripRider);

      const trip = await tripRepository.findOne({
        where: { trip_id: tripId },
        relations: ['tripRiders', 'driver'],
      });
      if (!trip) {
        throw new NotFoundException('Carpool trip not found');
      }
      this.assertIsDriver(trip, driverId);

      if (trip.status !== CarpoolTripStatus.IN_PROGRESS) {
        throw new BadRequestException('Only trips in progress can be completed');
      }
      if (!trip.meeting_point_confirmed_at) {
        throw new BadRequestException(
          'Confirm the meeting point before finishing the trip',
        );
      }

      trip.status = CarpoolTripStatus.COMPLETED;
      await tripRepository.save(trip);

      const ridersToClose = trip.tripRiders.filter(
        (rider) =>
          rider.status === TripRiderStatus.ACCEPTED ||
          rider.status === TripRiderStatus.BOARDED,
      );

      for (const rider of ridersToClose) {
        rider.status = TripRiderStatus.COMPLETED;
        rider.left_at = new Date();
      }

      if (ridersToClose.length) {
        await riderRepository.save(ridersToClose);
      }

      await this.notifyRiders(
        ridersToClose,
        NotificationReason.CARPOOL_ALERT,
        'Tu viaje terminó',
        `${trip.driver?.full_name ?? 'El conductor'} marcó el viaje como completado: llegaron a su destino. ${this.buildTripSummary(trip)} ¡Gracias por usar el carpool!`,
      );

      return trip;
    });
  }

  async cancelTrip(tripId: number, driverId: number, reason: string) {
    if (!reason || !reason.trim()) {
      throw new BadRequestException(
        'Debes indicar un motivo para cancelar el viaje',
      );
    }
    return this.dataSource.transaction(async (manager) => {
      const tripRepository = manager.getRepository(CarpoolTrip);
      const riderRepository = manager.getRepository(TripRider);

      const trip = await tripRepository.findOne({
        where: { trip_id: tripId },
        relations: ['tripRiders', 'driver'],
      });
      if (!trip) {
        throw new NotFoundException('Carpool trip not found');
      }
      this.assertIsDriver(trip, driverId);

      if (trip.status === CarpoolTripStatus.COMPLETED) {
        throw new BadRequestException(
          'A trip that already finished cannot be cancelled',
        );
      }
      if (trip.status === CarpoolTripStatus.CANCELLED) {
        throw new BadRequestException('The trip is already cancelled');
      }

      trip.status = CarpoolTripStatus.CANCELLED;
      trip.cancellation_reason = reason.trim();
      await tripRepository.save(trip);

      const activeRiders = trip.tripRiders.filter((rider) =>
        [
          TripRiderStatus.REQUESTED,
          TripRiderStatus.ACCEPTED,
          TripRiderStatus.BOARDED,
        ].includes(rider.status),
      );

      for (const rider of activeRiders) {
        rider.status = TripRiderStatus.CANCELLED;
        rider.responded_at = rider.responded_at ?? new Date();
      }

      if (activeRiders.length) {
        await riderRepository.save(activeRiders);
      }

      await this.notifyRiders(
        activeRiders,
        NotificationReason.CARPOOL_TRIP_CANCELLED,
        'Tu viaje fue cancelado',
        `${trip.driver?.full_name ?? 'El conductor'} canceló este viaje. Motivo: "${trip.cancellation_reason}". ${this.buildTripSummary(trip)} Tu lugar quedó liberado.`,
      );

      return trip;
    });
  }

  private assertIsDriver(trip: CarpoolTrip, driverId: number) {
    if (trip.driver_id !== driverId) {
      throw new BadRequestException('Only the trip driver can perform this action');
    }
  }
}

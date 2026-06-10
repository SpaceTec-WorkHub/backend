import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateCarpoolTripDto } from './dto/create-carpool_trip.dto';
import { UpdateCarpoolTripDto } from './dto/update-carpool_trip.dto';
import { StartCarpoolTripDto } from './dto/start-carpool-trip.dto';
import { EndCarpoolTripDto } from './dto/end-carpool-trip.dto';
import { ReportCarpoolTripIncidentDto } from './dto/report-carpool-trip-incident.dto';
import { CarpoolTrip, CarpoolTripStatus } from './entities/carpool_trip.entity';
import { TripRider, TripRiderStatus } from './entities/trip_rider.entity';
import { User } from '../user/entities/user.entity';
import { Vehicle } from '../vehicle/entities/vehicle.entity';
import { CarpoolTripIncident } from './entities/carpool_trip_incident.entity';

const START_WINDOW_MINUTES = 5;
const MAX_DISTANCE_METERS = 800;
const TEC_MTY_CAMPUS_LOCATION = {
  // cambiar ubicacion
  name: 'Tec de Monterrey Campus MTY',
  latitude: 25.6516,
  longitude: -100.289,
};

function haversineMeters(
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number,
) {
  const earthRadiusMeters = 6371000;
  const latitudeDelta = ((toLatitude - fromLatitude) * Math.PI) / 180;
  const longitudeDelta = ((toLongitude - fromLongitude) * Math.PI) / 180;
  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos((fromLatitude * Math.PI) / 180) *
      Math.cos((toLatitude * Math.PI) / 180) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getTripMeetingPoint(trip: CarpoolTrip) {
  void trip;
  return TEC_MTY_CAMPUS_LOCATION;
}

@Injectable()
export class CarpoolTripService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(CarpoolTrip)
    private readonly carpoolTripRepository: Repository<CarpoolTrip>,
    @InjectRepository(TripRider)
    private readonly tripRiderRepository: Repository<TripRider>,
    @InjectRepository(CarpoolTripIncident)
    private readonly carpoolTripIncidentRepository: Repository<CarpoolTripIncident>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
  ) {}

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
      throw new BadRequestException(
        'Vehicle must belong to the selected driver',
      );
    }

    if (createCarpoolTripDto.seats_total > vehicle.seats_total) {
      throw new BadRequestException(
        'Trip seats_total cannot exceed vehicle capacity',
      );
    }

    const trip = this.carpoolTripRepository.create({
      ...createCarpoolTripDto,
      trip_date: new Date(createCarpoolTripDto.trip_date),
      seats_available: createCarpoolTripDto.seats_total,
      status: createCarpoolTripDto.status ?? CarpoolTripStatus.OPEN,
      driver,
      vehicle,
    });

    return this.carpoolTripRepository.save(trip);
  }

  async findAll() {
    return this.carpoolTripRepository.find({
      relations: [
        'driver',
        'vehicle',
        'tripRiders',
        'tripRiders.user',
        'incidents',
        'incidents.reporter',
      ],
      order: { trip_date: 'ASC' },
    });
  }

  async findByUser(userId: number) {
    return this.carpoolTripRepository
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.driver', 'driver')
      .leftJoinAndSelect('trip.vehicle', 'vehicle')
      .leftJoinAndSelect('trip.tripRiders', 'tripRiders')
      .leftJoinAndSelect('tripRiders.user', 'riderUser')
      .leftJoinAndSelect('trip.incidents', 'incidents')
      .leftJoinAndSelect('incidents.reporter', 'incidentReporter')
      .where('trip.driver_id = :userId', { userId })
      .orWhere('tripRiders.user_id = :userId', { userId })
      .orderBy('trip.trip_date', 'ASC')
      .distinct(true)
      .getMany();
  }

  async findOne(id: number) {
    const trip = await this.carpoolTripRepository.findOne({
      where: { trip_id: id },
      relations: [
        'driver',
        'vehicle',
        'tripRiders',
        'tripRiders.user',
        'incidents',
        'incidents.reporter',
      ],
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

  private assertTripStartWindow(trip: CarpoolTrip) {
    const now = Date.now();
    const tripTime = new Date(trip.trip_date).getTime();
    const windowMs = START_WINDOW_MINUTES * 60 * 1000;

    if (Math.abs(now - tripTime) > windowMs) {
      throw new BadRequestException(
        'Trip can only be started within 5 minutes of the scheduled time',
      );
    }
  }

  private assertTripMeetingPoint(
    trip: CarpoolTrip,
    latitude: number,
    longitude: number,
  ) {
    const meetingPoint = getTripMeetingPoint(trip);

    if (!meetingPoint) {
      throw new BadRequestException(
        'No meeting point is configured for this route',
      );
    }

    const distance = haversineMeters(
      latitude,
      longitude,
      meetingPoint.latitude,
      meetingPoint.longitude,
    );

    if (distance > MAX_DISTANCE_METERS) {
      throw new BadRequestException(
        'You must be within 800 meters of the meeting point to start the trip',
      );
    }
  }

  private async assertTripParticipant(tripId: number, userId: number) {
    const participant = await this.tripRiderRepository.findOne({
      where: { trip_id: tripId, user_id: userId },
    });

    if (!participant) {
      throw new BadRequestException(
        'Only trip participants can report incidents',
      );
    }

    return participant;
  }

  async startTrip(tripId: number, payload: StartCarpoolTripDto) {
    return this.dataSource.transaction(async (manager) => {
      const tripRepository = manager.getRepository(CarpoolTrip);

      const trip = await tripRepository.findOne({
        where: { trip_id: tripId },
        relations: ['driver', 'vehicle', 'tripRiders'],
      });

      if (!trip) {
        throw new NotFoundException('Carpool trip not found');
      }

      if (trip.driver_id !== payload.user_id) {
        throw new BadRequestException('Only the driver can start this trip');
      }

      if (
        trip.status === CarpoolTripStatus.COMPLETED ||
        trip.status === CarpoolTripStatus.CANCELLED
      ) {
        throw new BadRequestException('This trip can no longer be started');
      }

      this.assertTripStartWindow(trip);
      this.assertTripMeetingPoint(trip, payload.latitude, payload.longitude);

      trip.status = CarpoolTripStatus.IN_PROGRESS;
      return tripRepository.save(trip);
    });
  }

  async endTrip(tripId: number, payload: EndCarpoolTripDto) {
    return this.dataSource.transaction(async (manager) => {
      const tripRepository = manager.getRepository(CarpoolTrip);
      const riderRepository = manager.getRepository(TripRider);

      const trip = await tripRepository.findOne({
        where: { trip_id: tripId },
        relations: ['driver', 'tripRiders'],
      });

      if (!trip) {
        throw new NotFoundException('Carpool trip not found');
      }

      if (trip.driver_id !== payload.user_id) {
        throw new BadRequestException('Only the driver can end this trip');
      }

      if (trip.status !== CarpoolTripStatus.IN_PROGRESS) {
        throw new BadRequestException(
          'Trip must be in progress before it can be ended',
        );
      }

      trip.status = CarpoolTripStatus.COMPLETED;

      const riders = await riderRepository.find({
        where: { trip_id: tripId },
      });

      for (const rider of riders) {
        if (
          rider.status === TripRiderStatus.ACCEPTED ||
          rider.status === TripRiderStatus.BOARDED
        ) {
          rider.status = TripRiderStatus.COMPLETED;
          rider.left_at = rider.left_at ?? new Date();
          await riderRepository.save(rider);
        }
      }

      return tripRepository.save(trip);
    });
  }

  async reportIncident(tripId: number, payload: ReportCarpoolTripIncidentDto) {
    const trip = await this.carpoolTripRepository.findOne({
      where: { trip_id: tripId },
      relations: ['tripRiders'],
    });

    if (!trip) {
      throw new NotFoundException('Carpool trip not found');
    }

    if (trip.driver_id !== payload.user_id) {
      await this.assertTripParticipant(tripId, payload.user_id);
    }

    const reporter = await this.userRepository.findOne({
      where: { user_id: payload.user_id },
    });

    if (!reporter) {
      throw new NotFoundException('User not found');
    }

    const incident = this.carpoolTripIncidentRepository.create({
      trip_id: tripId,
      reported_by: payload.user_id,
      type: payload.type,
      description: payload.description,
      notes: payload.notes ?? null,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      status: 'open',
      trip,
      reporter,
    });

    return this.carpoolTripIncidentRepository.save(incident);
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
        if (existing.status === TripRiderStatus.REQUESTED) {
          if (trip.seats_available <= 0) {
            throw new BadRequestException('No seats available');
          }

          existing.status = TripRiderStatus.ACCEPTED;
          existing.responded_at = new Date();
          existing.joined_at = new Date();

          trip.seats_available -= 1;
          trip.status =
            trip.seats_available === 0 ? CarpoolTripStatus.FULL : trip.status;

          await tripRepository.save(trip);
          return riderRepository.save(existing);
        }

        throw new BadRequestException(
          'User is already associated with this trip',
        );
      }

      if (trip.seats_available <= 0) {
        throw new BadRequestException('No seats available');
      }

      const tripRider = new TripRider();

      tripRider.trip = trip;
      tripRider.user = user;
      tripRider.trip_id = trip.trip_id;
      tripRider.user_id = user.user_id;
      tripRider.status = TripRiderStatus.ACCEPTED;
      tripRider.responded_at = new Date();
      tripRider.joined_at = new Date();
      tripRider.left_at = undefined;

      trip.seats_available -= 1;
      trip.status =
        trip.seats_available === 0 ? CarpoolTripStatus.FULL : trip.status;

      await tripRepository.save(trip);
      return riderRepository.save(tripRider);
    });
  }

  async requestRider(tripId: number, userId: number) {
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
        throw new BadRequestException(
          'User is already associated with this trip',
        );
      }

      const tripRider = new TripRider();

      tripRider.trip = trip;
      tripRider.user = user;
      tripRider.trip_id = trip.trip_id;
      tripRider.user_id = user.user_id;
      tripRider.status = TripRiderStatus.ACCEPTED;
      tripRider.responded_at = null;
      tripRider.joined_at = null;
      tripRider.left_at = null;

      return riderRepository.save(tripRider);
    });
  }

  async removeRider(tripId: number, userId: number) {
    return this.dataSource.transaction(async (manager) => {
      const tripRepository = manager.getRepository(CarpoolTrip);
      const riderRepository = manager.getRepository(TripRider);

      const trip = await tripRepository.findOne({
        where: { trip_id: tripId },
        relations: ['tripRiders'],
      });

      if (!trip) {
        throw new NotFoundException('Carpool trip not found');
      }

      const rider = await riderRepository.findOne({
        where: { trip_id: tripId, user_id: userId },
      });

      if (!rider) {
        throw new NotFoundException('Rider not found in this trip');
      }

      const occupiedSeat =
        rider.status === TripRiderStatus.ACCEPTED ||
        rider.status === TripRiderStatus.BOARDED;

      await riderRepository.delete({ trip_id: tripId, user_id: userId });

      if (occupiedSeat) {
        trip.seats_available += 1;

        if (trip.status === CarpoolTripStatus.FULL) {
          trip.status = CarpoolTripStatus.OPEN;
        }
      }

      return tripRepository.save(trip);
    });
  }
}

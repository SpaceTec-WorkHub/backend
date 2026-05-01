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
      throw new BadRequestException('Vehicle must belong to the selected driver');
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

      const tripRider = riderRepository.create({
        trip,
        user,
        trip_id: trip.trip_id,
        user_id: user.user_id,
        status: TripRiderStatus.ACCEPTED,
        responded_at: new Date(),
        joined_at: new Date(),
      });

      trip.seats_available -= 1;
      trip.status =
        trip.seats_available === 0 ? CarpoolTripStatus.FULL : trip.status;

      await tripRepository.save(trip);
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

      await riderRepository.delete({ trip_id: tripId, user_id: userId });

      trip.seats_available += 1;
      if (trip.status === CarpoolTripStatus.FULL) {
        trip.status = CarpoolTripStatus.OPEN;
      }

      return tripRepository.save(trip);
    });
  }
}

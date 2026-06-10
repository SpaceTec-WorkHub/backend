import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarpoolTripService } from './carpool_trip.service';
import { CarpoolTripController } from './carpool_trip.controller';
import { CarpoolTrip } from './entities/carpool_trip.entity';
import { TripRider } from './entities/trip_rider.entity';
import { CarpoolTripIncident } from './entities/carpool_trip_incident.entity';
import { User } from '../user/entities/user.entity';
import { Vehicle } from '../vehicle/entities/vehicle.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CarpoolTrip, TripRider, CarpoolTripIncident, User, Vehicle])],
  controllers: [CarpoolTripController],
  providers: [CarpoolTripService],
  exports: [CarpoolTripService],
})
export class CarpoolTripModule {}

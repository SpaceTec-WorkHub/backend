import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';
import { Reservation } from '../reservation/entities/reservation.entity';
import { SpaceUserUsage } from '../space_user_usage/entities/space_user_usage.entity';
import { Release } from '../release/entities/release.entity';
import { User } from '../user/entities/user.entity';
import { GamificationReward } from './entities/gamification-reward.entity';
import { CarpoolTrip } from '../carpool_trip/entities/carpool_trip.entity';
import { TripRider } from '../carpool_trip/entities/trip_rider.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reservation,
      SpaceUserUsage,
      Release,
      User,
      GamificationReward,
      CarpoolTrip,
      TripRider,
    ]),
  ],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
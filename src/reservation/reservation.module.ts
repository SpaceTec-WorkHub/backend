import { Module } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { ReservationController } from './reservation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from './entities/reservation.entity';
import { Incident } from './entities/incident.entity';
import { Space } from '../space/entities/space.entity';
import { Block } from '../block/entities/block.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation, Incident, Space, Block])],
  controllers: [ReservationController],
  providers: [ReservationService],
  exports: [ReservationService],
})
export class ReservationModule {}

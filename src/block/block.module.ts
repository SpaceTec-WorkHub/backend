import { Module } from '@nestjs/common';
import { BlockService } from './block.service';
import { BlockController } from './block.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Block } from './entities/block.entity';
import { Space } from '../space/entities/space.entity';
import { Zone } from '../zone/entities/zone.entity';
import { Reservation } from '../reservation/entities/reservation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Block, Space, Zone, Reservation])],
  controllers: [BlockController],
  providers: [BlockService],
  exports: [BlockService],
})
export class BlockModule {}

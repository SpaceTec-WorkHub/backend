import { Module } from '@nestjs/common';
import { ZoneService } from './zone.service';
import { ZoneController } from './zone.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Zone } from './entities/zone.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Zone])],
  controllers: [ZoneController],
  providers: [ZoneService],
  exports: [ZoneService],
})
export class ZoneModule {}

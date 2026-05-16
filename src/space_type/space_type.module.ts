import { Module } from '@nestjs/common';
import { SpaceTypeService } from './space_type.service';
import { SpaceTypeController } from './space_type.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpaceType } from './entities/space_type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SpaceType])],
  controllers: [SpaceTypeController],
  providers: [SpaceTypeService],
  exports: [SpaceTypeService],
})
export class SpaceTypeModule {}

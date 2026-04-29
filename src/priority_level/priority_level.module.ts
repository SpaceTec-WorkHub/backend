import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriorityLevelService } from './priority_level.service';
import { PriorityLevelController } from './priority_level.controller';
import { PriorityLevel } from './entities/priority_level.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PriorityLevel])],
  controllers: [PriorityLevelController],
  providers: [PriorityLevelService],
  exports: [PriorityLevelService],
})
export class PriorityLevelModule {}

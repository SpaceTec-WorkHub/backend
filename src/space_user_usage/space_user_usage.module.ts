import { Module } from '@nestjs/common';
import { SpaceUserUsageService } from './space_user_usage.service';
import { SpaceUserUsageController } from './space_user_usage.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpaceUserUsage } from './entities/space_user_usage.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SpaceUserUsage])],
  controllers: [SpaceUserUsageController],
  providers: [SpaceUserUsageService],
  exports: [SpaceUserUsageService],
})
export class SpaceUserUsageModule {}

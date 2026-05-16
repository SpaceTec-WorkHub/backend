import { Module } from '@nestjs/common';
import { ReleaseService } from './release.service';
import { ReleaseController } from './release.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Release } from './entities/release.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Release])],
  controllers: [ReleaseController],
  providers: [ReleaseService],
  exports: [ReleaseService],
})
export class ReleaseModule {}

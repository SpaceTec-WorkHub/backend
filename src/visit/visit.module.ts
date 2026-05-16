import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisitService } from './visit.service';
import { VisitController } from './visit.controller';
import { Visit } from './entities/visit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Visit])],
  controllers: [VisitController],
  providers: [VisitService],
  exports: [VisitService],
})
export class VisitModule {}

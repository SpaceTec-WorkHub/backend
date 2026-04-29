import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointsLedgerService } from './points_ledger.service';
import { PointsLedgerController } from './points_ledger.controller';
import { PointsLedger } from './entities/points_ledger.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PointsLedger])],
  controllers: [PointsLedgerController],
  providers: [PointsLedgerService],
  exports: [PointsLedgerService],
})
export class PointsLedgerModule {}

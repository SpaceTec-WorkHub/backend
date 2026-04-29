import { Test, TestingModule } from '@nestjs/testing';
import { PointsLedgerController } from './points_ledger.controller';
import { PointsLedgerService } from './points_ledger.service';

describe('PointsLedgerController', () => {
  let controller: PointsLedgerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PointsLedgerController],
      providers: [PointsLedgerService],
    }).compile();

    controller = module.get<PointsLedgerController>(PointsLedgerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

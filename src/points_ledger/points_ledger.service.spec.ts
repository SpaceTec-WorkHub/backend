import { Test, TestingModule } from '@nestjs/testing';
import { PointsLedgerService } from './points_ledger.service';

describe('PointsLedgerService', () => {
  let service: PointsLedgerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PointsLedgerService],
    }).compile();

    service = module.get<PointsLedgerService>(PointsLedgerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

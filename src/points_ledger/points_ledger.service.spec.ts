import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PointsLedgerService } from './points_ledger.service';
import { PointsLedger } from './entities/points_ledger.entity';

describe('PointsLedgerService', () => {
  let service: PointsLedgerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointsLedgerService,
        { provide: getRepositoryToken(PointsLedger), useValue: {} },
      ],
    }).compile();

    service = module.get<PointsLedgerService>(PointsLedgerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

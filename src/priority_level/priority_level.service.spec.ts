import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PriorityLevelService } from './priority_level.service';
import { PriorityLevel } from './entities/priority_level.entity';

describe('PriorityLevelService', () => {
  let service: PriorityLevelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriorityLevelService,
        { provide: getRepositoryToken(PriorityLevel), useValue: {} },
      ],
    }).compile();

    service = module.get<PriorityLevelService>(PriorityLevelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

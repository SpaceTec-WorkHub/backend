import { Test, TestingModule } from '@nestjs/testing';
import { PriorityLevelService } from './priority_level.service';

describe('PriorityLevelService', () => {
  let service: PriorityLevelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PriorityLevelService],
    }).compile();

    service = module.get<PriorityLevelService>(PriorityLevelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

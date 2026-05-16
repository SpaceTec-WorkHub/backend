import { Test, TestingModule } from '@nestjs/testing';
import { SpaceUserUsageService } from './space_user_usage.service';

describe('SpaceUserUsageService', () => {
  let service: SpaceUserUsageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpaceUserUsageService],
    }).compile();

    service = module.get<SpaceUserUsageService>(SpaceUserUsageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

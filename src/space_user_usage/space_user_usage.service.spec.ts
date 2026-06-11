import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SpaceUserUsageService } from './space_user_usage.service';
import { SpaceUserUsage } from './entities/space_user_usage.entity';

describe('SpaceUserUsageService', () => {
  let service: SpaceUserUsageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpaceUserUsageService,
        { provide: getRepositoryToken(SpaceUserUsage), useValue: {} },
      ],
    }).compile();

    service = module.get<SpaceUserUsageService>(SpaceUserUsageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

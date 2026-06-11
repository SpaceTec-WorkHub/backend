import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReleaseService } from './release.service';
import { Release } from './entities/release.entity';

describe('ReleaseService', () => {
  let service: ReleaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReleaseService,
        { provide: getRepositoryToken(Release), useValue: {} },
      ],
    }).compile();

    service = module.get<ReleaseService>(ReleaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

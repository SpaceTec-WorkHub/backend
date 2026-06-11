import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ZoneService } from './zone.service';
import { Zone } from './entities/zone.entity';

describe('ZoneService', () => {
  let service: ZoneService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZoneService,
        { provide: getRepositoryToken(Zone), useValue: {} },
      ],
    }).compile();

    service = module.get<ZoneService>(ZoneService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

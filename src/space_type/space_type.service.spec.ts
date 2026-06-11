import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SpaceTypeService } from './space_type.service';
import { SpaceType } from './entities/space_type.entity';

describe('SpaceTypeService', () => {
  let service: SpaceTypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpaceTypeService,
        { provide: getRepositoryToken(SpaceType), useValue: {} },
      ],
    }).compile();

    service = module.get<SpaceTypeService>(SpaceTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { SpaceTypeService } from './space_type.service';

describe('SpaceTypeService', () => {
  let service: SpaceTypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpaceTypeService],
    }).compile();

    service = module.get<SpaceTypeService>(SpaceTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

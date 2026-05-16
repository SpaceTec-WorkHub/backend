import { Test, TestingModule } from '@nestjs/testing';
import { SpaceTypeController } from './space_type.controller';
import { SpaceTypeService } from './space_type.service';

describe('SpaceTypeController', () => {
  let controller: SpaceTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpaceTypeController],
      providers: [SpaceTypeService],
    }).compile();

    controller = module.get<SpaceTypeController>(SpaceTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

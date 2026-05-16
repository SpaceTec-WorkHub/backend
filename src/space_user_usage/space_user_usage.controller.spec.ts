import { Test, TestingModule } from '@nestjs/testing';
import { SpaceUserUsageController } from './space_user_usage.controller';
import { SpaceUserUsageService } from './space_user_usage.service';

describe('SpaceUserUsageController', () => {
  let controller: SpaceUserUsageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpaceUserUsageController],
      providers: [SpaceUserUsageService],
    }).compile();

    controller = module.get<SpaceUserUsageController>(SpaceUserUsageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

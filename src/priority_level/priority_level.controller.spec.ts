import { Test, TestingModule } from '@nestjs/testing';
import { PriorityLevelController } from './priority_level.controller';
import { PriorityLevelService } from './priority_level.service';

describe('PriorityLevelController', () => {
  let controller: PriorityLevelController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PriorityLevelController],
      providers: [PriorityLevelService],
    }).compile();

    controller = module.get<PriorityLevelController>(PriorityLevelController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { CheckEventController } from './check_event.controller';
import { CheckEventService } from './check_event.service';

describe('CheckEventController', () => {
  let controller: CheckEventController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CheckEventController],
      providers: [CheckEventService],
    }).compile();

    controller = module.get<CheckEventController>(CheckEventController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

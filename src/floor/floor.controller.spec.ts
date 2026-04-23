import { Test, TestingModule } from '@nestjs/testing';
import { FloorController } from './floor.controller';
import { FloorService } from './floor.service';

describe('FloorController', () => {
  let controller: FloorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FloorController],
      providers: [FloorService],
    }).compile();

    controller = module.get<FloorController>(FloorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

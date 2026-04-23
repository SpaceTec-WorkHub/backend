import { Test, TestingModule } from '@nestjs/testing';
import { FloorService } from './floor.service';

describe('FloorService', () => {
  let service: FloorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FloorService],
    }).compile();

    service = module.get<FloorService>(FloorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

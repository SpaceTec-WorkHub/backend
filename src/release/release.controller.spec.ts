import { Test, TestingModule } from '@nestjs/testing';
import { ReleaseController } from './release.controller';
import { ReleaseService } from './release.service';

describe('ReleaseController', () => {
  let controller: ReleaseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReleaseController],
      providers: [ReleaseService],
    }).compile();

    controller = module.get<ReleaseController>(ReleaseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

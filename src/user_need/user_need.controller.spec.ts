import { Test, TestingModule } from '@nestjs/testing';
import { UserNeedController } from './user_need.controller';
import { UserNeedService } from './user_need.service';

describe('UserNeedController', () => {
  let controller: UserNeedController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserNeedController],
      providers: [UserNeedService],
    }).compile();

    controller = module.get<UserNeedController>(UserNeedController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

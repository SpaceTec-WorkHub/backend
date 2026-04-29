import { Test, TestingModule } from '@nestjs/testing';
import { UserNeedService } from './user_need.service';

describe('UserNeedService', () => {
  let service: UserNeedService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserNeedService],
    }).compile();

    service = module.get<UserNeedService>(UserNeedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

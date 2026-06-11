import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserNeedService } from './user_need.service';
import { UserNeed } from './entities/user_need.entity';

describe('UserNeedService', () => {
  let service: UserNeedService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserNeedService,
        { provide: getRepositoryToken(UserNeed), useValue: {} },
      ],
    }).compile();

    service = module.get<UserNeedService>(UserNeedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

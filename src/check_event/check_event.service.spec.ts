import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CheckEventService } from './check_event.service';
import { CheckEvent } from './entities/check_event.entity';

describe('CheckEventService', () => {
  let service: CheckEventService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckEventService,
        { provide: getRepositoryToken(CheckEvent), useValue: {} },
      ],
    }).compile();

    service = module.get<CheckEventService>(CheckEventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

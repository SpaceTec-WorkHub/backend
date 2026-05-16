import { Test, TestingModule } from '@nestjs/testing';
import { CheckEventService } from './check_event.service';

describe('CheckEventService', () => {
  let service: CheckEventService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CheckEventService],
    }).compile();

    service = module.get<CheckEventService>(CheckEventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

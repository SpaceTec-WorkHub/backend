import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BlockService } from './block.service';
import { Block } from './entities/block.entity';
import { Space } from '../space/entities/space.entity';
import { Zone } from '../zone/entities/zone.entity';
import { Reservation } from '../reservation/entities/reservation.entity';

describe('BlockService', () => {
  let service: BlockService;
  let blockRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    merge: jest.Mock;
    softRemove: jest.Mock;
  };
  let spaceRepository: {
    find: jest.Mock;
  };
  let zoneRepository: {
    findOne: jest.Mock;
  };
  let reservationRepository: {
    createQueryBuilder: jest.Mock;
    save: jest.Mock;
  };
  let reservationQueryBuilder: {
    where: jest.Mock;
    andWhere: jest.Mock;
    getMany: jest.Mock;
  };

  beforeEach(async () => {
    reservationQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    blockRepository = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
      find: jest.fn(),
      findOne: jest.fn(),
      merge: jest.fn(),
      softRemove: jest.fn(),
    };

    spaceRepository = {
      find: jest.fn(),
    };

    zoneRepository = {
      findOne: jest.fn(),
    };

    reservationRepository = {
      createQueryBuilder: jest.fn(() => reservationQueryBuilder),
      save: jest.fn(async (value) => value),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockService,
        { provide: getRepositoryToken(Block), useValue: blockRepository },
        { provide: getRepositoryToken(Space), useValue: spaceRepository },
        { provide: getRepositoryToken(Zone), useValue: zoneRepository },
        { provide: getRepositoryToken(Reservation), useValue: reservationRepository },
      ],
    }).compile();

    service = module.get<BlockService>(BlockService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a block for each selected space and cancels overlapping reservations', async () => {
    spaceRepository.find.mockResolvedValue([
      { space_id: 10, code: 'D-101' },
      { space_id: 11, code: 'D-102' },
    ]);
    reservationQueryBuilder.getMany.mockResolvedValue([
      { reservation_id: 1, status: 'reserved' },
      { reservation_id: 2, status: 'checked_in' },
    ]);

    const result = await service.createSpaceBlocks({
      space_ids: [10, 11],
      reason: 'Maintenance',
      start_time: '2026-05-20T10:00:00.000Z',
      end_time: '2026-05-20T12:00:00.000Z',
    });

    expect(spaceRepository.find).toHaveBeenCalled();
    expect(reservationRepository.save).toHaveBeenCalled();
    expect(blockRepository.save).toHaveBeenCalledWith([
      expect.objectContaining({ space_id: 10, zone_id: null, reason: 'Maintenance' }),
      expect.objectContaining({ space_id: 11, zone_id: null, reason: 'Maintenance' }),
    ]);
    expect(result.blocks).toHaveLength(2);
    expect(result.cancelledReservations).toBe(2);
  });

  it('rejects empty space selection', async () => {
    await expect(
      service.createSpaceBlocks({
        space_ids: [],
        reason: 'Maintenance',
        start_time: '2026-05-20T10:00:00.000Z',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});

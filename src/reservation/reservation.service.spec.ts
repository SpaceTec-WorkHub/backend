import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReservationService } from './reservation.service';
import { Reservation } from './entities/reservation.entity';
import { Space } from '../space/entities/space.entity';
import { Incident } from './entities/incident.entity';
import { Block } from '../block/entities/block.entity';
import { GamificationService } from '../gamification/gamification.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('ReservationService', () => {
  let service: ReservationService;
  let reservationRepository: {
    createQueryBuilder: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    findOne: jest.Mock;
    find: jest.Mock;
  };
  let spaceRepository: {
    findOne: jest.Mock;
    find: jest.Mock;
  };
  let incidentRepository: {
    create: jest.Mock;
    save: jest.Mock;
  };
  let blockRepository: {
    createQueryBuilder: jest.Mock;
  };
  let notificationsService: {
    create: jest.Mock;
  };
  let reservationQueryBuilder: {
    update: jest.Mock;
    set: jest.Mock;
    execute: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    getExists: jest.Mock;
    select: jest.Mock;
    addSelect: jest.Mock;
    getRawMany: jest.Mock;
    leftJoinAndSelect: jest.Mock;
    orderBy: jest.Mock;
    addOrderBy: jest.Mock;
    getMany: jest.Mock;
  };
  let blockQueryBuilder: {
    where: jest.Mock;
    andWhere: jest.Mock;
    getExists: jest.Mock;
    select: jest.Mock;
    addSelect: jest.Mock;
    getRawMany: jest.Mock;
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(Date.parse('2026-05-18T14:20:00.000Z'));

    reservationQueryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      execute: jest.fn(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getExists: jest.fn(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    blockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getExists: jest.fn(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
    };

    reservationRepository = {
      createQueryBuilder: jest.fn(() => reservationQueryBuilder),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
      update: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    spaceRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    incidentRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    blockRepository = {
      createQueryBuilder: jest.fn(() => blockQueryBuilder),
    };

    notificationsService = {
      create: jest.fn(),
    };
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  let testingModule: TestingModule;

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      providers: [
        ReservationService,
        { provide: getRepositoryToken(Reservation), useValue: reservationRepository },
        { provide: getRepositoryToken(Space), useValue: spaceRepository },
        { provide: getRepositoryToken(Incident), useValue: incidentRepository },
        { provide: getRepositoryToken(Block), useValue: blockRepository },
        { provide: GamificationService, useValue: { applyPenalty: jest.fn() } },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = testingModule.get<ReservationService>(ReservationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('allows creating a reservation that already started but still ends in the future', async () => {
    spaceRepository.findOne.mockResolvedValue({ space_id: 1, zone_id: 10 });
    blockQueryBuilder.getExists.mockResolvedValue(false);
    reservationQueryBuilder.getExists.mockResolvedValue(false);

    const result = await service.create({
      start_time: '2026-05-18T14:00:00.000Z',
      end_time: '2026-05-18T15:00:00.000Z',
      code: 'RES-001',
      user_id: 7,
      space_id: 1,
    });

    expect(result).toMatchObject({
      start_time: '2026-05-18T14:00:00.000Z',
      end_time: '2026-05-18T15:00:00.000Z',
      code: 'RES-001',
      user_id: 7,
      space_id: 1,
      status: 'reserved',
    });
    expect(reservationRepository.save).toHaveBeenCalled();
  });

  it('uses current time as overlap start when creating a reservation for an in-progress slot', async () => {
    spaceRepository.findOne.mockResolvedValue({ space_id: 1, zone_id: 10 });
    blockQueryBuilder.getExists.mockResolvedValue(false);
    reservationQueryBuilder.getExists.mockResolvedValue(false);

    await service.create({
      start_time: '2026-05-18T14:00:00.000Z',
      end_time: '2026-05-18T15:00:00.000Z',
      code: 'RES-001-B',
      user_id: 7,
      space_id: 1,
    });

    const overlapCall = reservationQueryBuilder.andWhere.mock.calls.find(
      ([condition]) => typeof condition === 'string' && condition.includes(') > :start'),
    );

    expect(overlapCall).toBeDefined();
    expect(overlapCall[1]).toEqual(
      expect.objectContaining({
        start: new Date('2026-05-18T14:20:00.000Z'),
      }),
    );
  });

  it('uses checkout time when checking availability for spaces', async () => {
    spaceRepository.find.mockResolvedValue([
      {
        space_id: 1,
        zone_id: 10,
        code: 'A-01',
        status: 'available',
      },
    ]);
    reservationQueryBuilder.getRawMany.mockResolvedValue([]);
    blockQueryBuilder.getRawMany.mockResolvedValue([]);

    await service.findAvailableSpaces('2026-05-18', '14:30', '15:00');

    const overlapCondition = reservationQueryBuilder.andWhere.mock.calls
      .map(([condition]) => condition)
      .join(' ');

    expect(overlapCondition).toContain('check_out_time');
  });

  it('uses current time as overlap start when checking available spaces for an in-progress slot', async () => {
    spaceRepository.find.mockResolvedValue([
      {
        space_id: 1,
        zone_id: 10,
        code: 'A-01',
        status: 'available',
      },
    ]);
    reservationQueryBuilder.getRawMany.mockResolvedValue([]);
    blockQueryBuilder.getRawMany.mockResolvedValue([]);

    await service.findAvailableSpaces('2026-05-18', '2026-05-18T14:00:00.000Z', '2026-05-18T15:00:00.000Z');

    const overlapCall = reservationQueryBuilder.andWhere.mock.calls.find(
      ([condition]) => typeof condition === 'string' && condition.includes(') > :start'),
    );

    expect(overlapCall).toBeDefined();
    expect(overlapCall[1]).toEqual(
      expect.objectContaining({
        start: new Date('2026-05-18T14:20:00.000Z'),
      }),
    );
  });

  it('filters active reservations by current time cutoff', async () => {
    reservationQueryBuilder.getMany.mockResolvedValue([]);

    await service.syncNoShowReservations();

    expect(reservationQueryBuilder.getMany).toHaveBeenCalled();
    expect(reservationQueryBuilder.andWhere).toHaveBeenCalledWith(
      'reservation.start_time <= :noShowThreshold',
      expect.objectContaining({ noShowThreshold: expect.any(Date) }),
    );
  });

  it('filters spaces of the same type when the user already has an active reservation of that type', async () => {
    spaceRepository.find.mockResolvedValue([
      {
        space_id: 1,
        code: 'A-01',
        status: 'available',
        zone_id: 10,
        space_type: { name: 'Desk' },
      },
      {
        space_id: 2,
        code: 'A-02',
        status: 'available',
        zone_id: 10,
        space_type: { name: 'Meeting Room' },
      },
    ]);
    reservationQueryBuilder.getRawMany.mockResolvedValue([]);
    blockQueryBuilder.getRawMany.mockResolvedValue([]);
    reservationRepository.find.mockResolvedValue([
      {
        start_time: new Date('2026-05-18T14:00:00.000Z'),
        end_time: new Date('2026-05-18T15:00:00.000Z'),
        status: 'reserved',
        space: { space_type: { name: 'Desk' } },
      },
    ]);

    const spaces = await service.findAvailableSpaces(
      '2026-05-18',
      '2026-05-18T14:00:00.000Z',
      '2026-05-18T15:00:00.000Z',
      7,
    );

    expect(spaces).toHaveLength(1);
    expect(spaces[0].space_id).toBe(2);
  });

  it('marks past due reserved reservations as no show', async () => {
    reservationQueryBuilder.getMany.mockResolvedValue([
      { reservation_id: 5, user_id: 7, event_id: null, status: 'reserved', no_show_at: null },
    ]);

    await service.syncNoShowReservations();

    expect(reservationQueryBuilder.getMany).toHaveBeenCalled();
    expect(reservationRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'no_show',
        no_show_at: expect.any(Date),
      }),
    );
    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 7,
        reason: 'no_show',
      }),
    );
  });

  it('rejects reservations that have already fully ended', async () => {
    spaceRepository.findOne.mockResolvedValue({ space_id: 1, zone_id: 10 });
    blockQueryBuilder.getExists.mockResolvedValue(false);
    reservationQueryBuilder.getExists.mockResolvedValue(false);

    await expect(
      service.create({
        start_time: '2026-05-18T13:00:00.000Z',
        end_time: '2026-05-18T14:10:00.000Z',
        code: 'RES-002',
        user_id: 7,
        space_id: 1,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('auto-extends ended reservation and applies penalty when no overlapping reservation', async () => {
    // ended reservation (end_time <= now)
    const reservation = {
      reservation_id: 11,
      space_id: 1,
      user_id: 7,
      status: 'reserved',
      check_out_time: null,
      start_time: '2026-05-18T14:00:00.000Z',
      end_time: '2026-05-18T14:20:00.000Z',
      user: { user_id: 7 },
    } as any;

    reservationRepository.find.mockResolvedValue([reservation]);
    spaceRepository.findOne.mockResolvedValue({ space_id: 1, zone_id: 10 });
    blockQueryBuilder.getExists.mockResolvedValue(false);
    reservationQueryBuilder.getExists.mockResolvedValue(false);

    const gamification = testingModule.get< GamificationService >(GamificationService);

    await service.syncEndOfReservations();

    expect(reservationRepository.save).toHaveBeenCalled();
    const saved = (reservationRepository.save as jest.Mock).mock.calls.pop()[0];
    expect(saved.status).toBe('checkout_pending');
    expect(gamification.applyPenalty).toHaveBeenCalledWith(7, expect.any(Number), 11);
  });

  it('finalizes ended reservation when overlapping reservation exists', async () => {
    const reservation = {
      reservation_id: 12,
      space_id: 2,
      user_id: 8,
      status: 'checked_in',
      check_out_time: null,
      start_time: '2026-05-18T13:00:00.000Z',
      end_time: '2026-05-18T14:10:00.000Z',
      user: { user_id: 8 },
    } as any;

    reservationRepository.find.mockResolvedValue([reservation]);
    spaceRepository.findOne.mockResolvedValue({ space_id: 2, zone_id: 20 });
    blockQueryBuilder.getExists.mockResolvedValue(false);
    reservationQueryBuilder.getExists.mockResolvedValue(true); // overlap prevents extension

    const gamification = testingModule.get< GamificationService >(GamificationService);

    await service.syncEndOfReservations();

    expect(reservationRepository.save).toHaveBeenCalled();
    const saved = (reservationRepository.save as jest.Mock).mock.calls.pop()[0];
    expect(saved.status).toBe('checked_out');
    expect(saved.check_out_time).toEqual(new Date(reservation.end_time));
    expect(gamification.applyPenalty).not.toHaveBeenCalled();
  });
});

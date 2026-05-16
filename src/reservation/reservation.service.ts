import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { Space, SpaceStatus } from '../space/entities/space.entity';
import { Incident, IncidentStatus } from './entities/incident.entity';
import { CreateSpecialEventDto } from './dto/create-special-event.dto';
import { ReportIncidentDto } from './dto/report-incident.dto';
import { Block } from '../block/entities/block.entity';

@Injectable()
export class ReservationService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(Space)
    private readonly spaceRepository: Repository<Space>,
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
  ) {}

  private getReservationRelations() {
    return [
      'user',
      'space',
      'space.space_type',
      'space.zone',
      'release',
      'event',
      'checkEvents',
      'incidents',
    ];
  }

  private parseDateTime(date: string, timeOrIso: string) {
    if (timeOrIso.includes('T')) {
      const parsedIso = new Date(timeOrIso);

      if (Number.isNaN(parsedIso.getTime())) {
        throw new BadRequestException('Invalid date-time format');
      }

      return parsedIso;
    }

    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = timeOrIso.split(':').map(Number);
    const parsedLocal = new Date(year, month - 1, day, hours, minutes, 0, 0);

    if (Number.isNaN(parsedLocal.getTime())) {
      throw new BadRequestException('Invalid date-time format');
    }

    return parsedLocal;
  }

  private assertOwnerOrAdmin(reservation: Reservation, userId: number, isAdmin?: boolean) {
    if (!isAdmin && reservation.user_id !== userId) {
      throw new ForbiddenException('You can only act on your own reservations');
    }
  }

  private async assertSpaceIsNotBlocked(spaceId: number, start: Date, end: Date) {
    const space = await this.spaceRepository.findOne({
      where: { space_id: spaceId },
      relations: ['zone'],
    });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    const hasBlockingRecord = await this.blockRepository
      .createQueryBuilder('block')
      .where('(block.space_id = :spaceId OR block.zone_id = :zoneId)', {
        spaceId,
        zoneId: space.zone_id,
      })
      .andWhere('block.start_time < :end', { end })
      .andWhere('(block.end_time IS NULL OR block.end_time > :start)', { start })
      .getExists();

    if (hasBlockingRecord) {
      throw new BadRequestException('This space is blocked for the selected time range');
    }
  }

  async create(createReservationDto: CreateReservationDto) {
    // Parse dates
    const startTime = new Date(createReservationDto.start_time);
    const endTime = new Date(createReservationDto.end_time);

    // Validate date format
    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      throw new BadRequestException('Invalid date-time format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)');
    }

    // Validate end time > start time
    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    // Validate start time is not in the past
    const now = new Date();
    if (startTime < now) {
      throw new BadRequestException(`Cannot reserve for past times. Current time: ${now.toISOString()}, requested start: ${startTime.toISOString()}`);
    }

    await this.assertSpaceIsNotBlocked(createReservationDto.space_id, startTime, endTime);

    const newReservation = this.reservationRepository.create(
      {
        ...createReservationDto,
        status: ReservationStatus.RESERVED,
        check_in_time: null,
        check_out_time: null,
        no_show_at: null,
        incident_notes: null,
        reassigned_space_id: null,
        latitude_check_in: null,
        longitude_check_in: null,
      },
    );

    return this.reservationRepository.save(newReservation);
  }

  findAll() {
    return this.reservationRepository.find({
      relations: this.getReservationRelations(),
      order: {
        start_time: 'DESC',
      },
    });
  }

  async findActiveReservations(userId: number | null, isAdmin: boolean) {
    const statuses = [
      ReservationStatus.RESERVED,
      ReservationStatus.CHECKED_IN,
      ReservationStatus.CHECKOUT_PENDING,
      ReservationStatus.INCIDENT,
    ];

    return this.reservationRepository.find({
      where: {
        status: In(statuses),
        ...(isAdmin ? {} : { user_id: userId ?? -1 }),
      },
      relations: this.getReservationRelations(),
      order: {
        start_time: 'DESC',
      },
    });
  }

  async findReservationHistory(userId: number | null, isAdmin: boolean) {
    const statuses = [
      ReservationStatus.CHECKED_OUT,
      ReservationStatus.NO_SHOW,
      ReservationStatus.CANCELLED,
      ReservationStatus.INCIDENT,
    ];

    return this.reservationRepository.find({
      where: {
        status: In(statuses),
        ...(isAdmin ? {} : { user_id: userId ?? -1 }),
      },
      relations: this.getReservationRelations(),
      order: {
        start_time: 'DESC',
      },
    });
  }

  async findAvailableTimeSlots(date: string) {
    const slots: Array<{
      label: string;
      start_time: string;
      end_time: string;
      available_space_count: number;
      is_available: boolean;
    }> = [];

    for (let hour = 8; hour < 18; hour += 1) {
      const start = `${String(hour).padStart(2, '0')}:00`;
      const end = `${String(hour + 1).padStart(2, '0')}:00`;
      const spaces = await this.findAvailableSpaces(date, start, end);

      slots.push({
        label: `${start} - ${end}`,
        start_time: start,
        end_time: end,
        available_space_count: spaces.length,
        is_available: spaces.length > 0,
      });
    }

    return slots;
  }

  async findAvailableSpaces(date: string, startTime: string, endTime: string) {
    const start = this.parseDateTime(date, startTime);
    const end = this.parseDateTime(date, endTime);

    if (end <= start) {
      throw new BadRequestException('End time must be after start time');
    }

    const spaces = await this.spaceRepository.find({
      where: { status: SpaceStatus.AVAILABLE },
      relations: ['space_type', 'zone'],
      order: {
        code: 'ASC',
      },
    });

    const overlappingReservations = await this.reservationRepository
      .createQueryBuilder('reservation')
      .select('reservation.space_id', 'space_id')
      .where('reservation.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: [ReservationStatus.CANCELLED, ReservationStatus.NO_SHOW],
      })
      .andWhere('reservation.start_time < :end', { end })
      .andWhere('reservation.end_time > :start', { start })
      .getRawMany<{ space_id: number }>();

    const occupiedIds = new Set(overlappingReservations.map((item) => Number(item.space_id)));

    const overlappingBlocks = await this.blockRepository
      .createQueryBuilder('block')
      .select('block.space_id', 'space_id')
      .addSelect('block.zone_id', 'zone_id')
      .where('block.start_time < :end', { end })
      .andWhere('(block.end_time IS NULL OR block.end_time > :start)', { start })
      .getRawMany<{ space_id: number | null; zone_id: number | null }>();

    const blockedSpaceIds = new Set(
      overlappingBlocks
        .map((item) => item.space_id)
        .filter((spaceId): spaceId is number => spaceId !== null)
        .map((spaceId) => Number(spaceId)),
    );

    const blockedZoneIds = new Set(
      overlappingBlocks
        .map((item) => item.zone_id)
        .filter((zoneId): zoneId is number => zoneId !== null)
        .map((zoneId) => Number(zoneId)),
    );

    return spaces.filter(
      (space) =>
        !occupiedIds.has(space.space_id) &&
        !blockedSpaceIds.has(space.space_id) &&
        !blockedZoneIds.has(space.zone_id),
    );
  }

  async createSpecialEventReservations(createSpecialEventDto: CreateSpecialEventDto) {
    const startTime = new Date(createSpecialEventDto.start_time);
    const endTime = new Date(createSpecialEventDto.end_time);

    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime()) || endTime <= startTime) {
      throw new BadRequestException('Invalid reservation window for special event');
    }

    const spaces = await this.spaceRepository.find({
      where: {
        zone_id: createSpecialEventDto.zone_id,
        status: SpaceStatus.AVAILABLE,
      },
      order: {
        code: 'ASC',
      },
    });

    const createdReservations: Reservation[] = [];

    for (let index = 0; index < spaces.length; index += 1) {
      const space = spaces[index];
      const code = `EVT-${Date.now()}-${space.space_id}-${index + 1}`;
      const reservation = this.reservationRepository.create({
        start_time: startTime,
        end_time: endTime,
        code,
        user_id: createSpecialEventDto.user_id,
        space_id: space.space_id,
        status: ReservationStatus.RESERVED,
      });

      const saved = await this.reservationRepository.save(reservation);
      createdReservations.push(saved);
    }

    return createdReservations;
  }

  async checkIn(
    reservationId: number,
    userId: number,
    options?: { latitude?: number; longitude?: number; isAdmin?: boolean },
  ) {
    const reservation = await this.findOne(reservationId);
    this.assertOwnerOrAdmin(reservation, userId, options?.isAdmin);

    reservation.status = ReservationStatus.CHECKED_IN;
    reservation.check_in_time = new Date();
    reservation.latitude_check_in = options?.latitude ?? null;
    reservation.longitude_check_in = options?.longitude ?? null;

    return this.reservationRepository.save(reservation);
  }

  async checkOut(reservationId: number, userId: number, options?: { isAdmin?: boolean }) {
    const reservation = await this.findOne(reservationId);
    this.assertOwnerOrAdmin(reservation, userId, options?.isAdmin);

    reservation.status = ReservationStatus.CHECKED_OUT;
    reservation.check_out_time = new Date();

    return this.reservationRepository.save(reservation);
  }

  async extendReservation(
    reservationId: number,
    userId: number,
    newEndTime: string,
    options?: { isAdmin?: boolean },
  ) {
    const reservation = await this.findOne(reservationId);
    this.assertOwnerOrAdmin(reservation, userId, options?.isAdmin);

    const parsedEnd = new Date(newEndTime);

    if (Number.isNaN(parsedEnd.getTime()) || parsedEnd <= new Date(reservation.start_time)) {
      throw new BadRequestException('Invalid new end time');
    }

    reservation.end_time = parsedEnd;
    return this.reservationRepository.save(reservation);
  }

  async reportIncident(
    reservationId: number,
    userId: number,
    reportIncidentDto: ReportIncidentDto,
    options?: { isAdmin?: boolean },
  ) {
    const reservation = await this.findOne(reservationId);
    this.assertOwnerOrAdmin(reservation, userId, options?.isAdmin);

    reservation.status = ReservationStatus.INCIDENT;
    reservation.incident_notes = reportIncidentDto.notes ?? reportIncidentDto.description;
    const updatedReservation = await this.reservationRepository.save(reservation);

    const incident = this.incidentRepository.create({
      reservation_id: reservation.reservation_id,
      reported_by: userId,
      space_id: reservation.space_id,
      previous_reservation_id: null,
      type: reportIncidentDto.type,
      description: reportIncidentDto.description,
      status: IncidentStatus.OPEN,
      created_at: new Date(),
    });

    await this.incidentRepository.save(incident);
    return updatedReservation;
  }

  findByUser(userId: number) {
    return this.reservationRepository.find({
      where: { user_id: userId },
      relations: this.getReservationRelations(),
      order: {
        start_time: 'DESC',
      },
    });
  }

  async findOne(reservation_id: number) {
    const reservation = await this.reservationRepository.findOne({
      where: { reservation_id },
      relations: this.getReservationRelations(),
    });

    if (!reservation) {
      throw new NotFoundException();
    }

    return reservation;
  }

  async update(id: number, updateReservationDto: UpdateReservationDto) {
    const existingReservation = await this.findOne(id);

    this.reservationRepository.merge(existingReservation, updateReservationDto);

    return this.reservationRepository.save(existingReservation);
  }

  async remove(id: number) {
    const existingReservation = await this.findOne(id);
    await this.reservationRepository.softRemove(existingReservation);

    return existingReservation;
  }
}

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { Incident, IncidentStatus } from './entities/incident.entity';
import { Space } from '../space/entities/space.entity';
import { SpaceStatus } from '../space/entities/space.entity';
import { Block } from '../block/entities/block.entity';
import { CreateSpecialEventDto } from './dto/create-special-event.dto';
import { ReportIncidentDto } from './dto/report-incident.dto';

type ActorContext = {
  isAdmin?: boolean;
};

type CheckInLocation = {
  latitude?: number;
  longitude?: number;
  isAdmin?: boolean;
};

type ReservationWindow = {
  start_time: Date;
  end_time: Date;
  reservation_id?: number;
};

type TimeSlotAvailability = {
  label: string;
  start_time: string;
  end_time: string;
  available_space_count: number;
  is_available: boolean;
};

type AvailableSpace = {
  space_id: number;
  code: string;
  is_accessible: boolean;
  is_priority: boolean;
  status: SpaceStatus;
  zone: { name: string } | null;
  space_type: { name: string } | null;
};

const WORKDAY_START_HOUR = 8;
const WORKDAY_END_HOUR = 18;
const CHECK_IN_WINDOW_BEFORE_MINUTES = 15;
const CHECK_IN_WINDOW_AFTER_MINUTES = 20;
const RESERVATION_BUFFER_MINUTES = 30;
const OFFICE_LATITUDE = 25.650546;
const OFFICE_LONGITUDE = -100.289857;
const CHECK_IN_RADIUS_METERS = 1000;
const ACTIVE_RESERVATION_STATUSES = [
  ReservationStatus.RESERVED,
  ReservationStatus.CHECKED_IN,
  ReservationStatus.CHECKOUT_PENDING,
  ReservationStatus.INCIDENT,
];
const HISTORY_RESERVATION_STATUSES = [
  ReservationStatus.CHECKED_OUT,
  ReservationStatus.NO_SHOW,
  ReservationStatus.CANCELLED,
  ReservationStatus.INCIDENT,
];

@Injectable()
export class ReservationService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(Space)
    private readonly spaceRepository: Repository<Space>,
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
  ) {}

  private parseLocalDate(dateValue: string) {
    if (!dateValue) {
      throw new BadRequestException('Date is required');
    }

    const [year, month, day] = dateValue.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException('Invalid date');
    }

    return parsedDate;
  }

  private parseLocalTime(dateValue: string, timeValue: string) {
    if (!dateValue || !timeValue) {
      throw new BadRequestException('Date and time are required');
    }

    const baseDate = this.parseLocalDate(dateValue);
    const [hours, minutes] = timeValue.split(':').map(Number);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      throw new BadRequestException('Invalid time');
    }

    baseDate.setHours(hours, minutes, 0, 0);
    return baseDate;
  }

  private buildTimeLabel(hour: number) {
    const start = `${String(hour).padStart(2, '0')}:00`;
    const end = `${String(hour + 1).padStart(2, '0')}:00`;
    return { start, end, label: `${start} - ${end}` };
  }

  private addMinutes(dateValue: Date, minutes: number) {
    return new Date(dateValue.getTime() + minutes * 60 * 1000);
  }

  private getReservationRelations() {
    return [
      'user',
      'space',
      'space.space_type',
      'space.zone',
      'release',
      'reassigned_space',
      'incidents',
      'event',
      'checkEvents',
    ];
  }

  private isAdmin(actor?: ActorContext) {
    return actor?.isAdmin === true;
  }

  private assertOwnerOrAdmin(reservation: Reservation, userId: number, actor?: ActorContext) {
    if (!this.isAdmin(actor) && reservation.user_id !== userId) {
      throw new ForbiddenException('You can only act on your own reservations');
    }
  }

  private async findReservationOrThrow(reservationId: number) {
    const reservation = await this.reservationRepository.findOne({
      where: { reservation_id: reservationId },
      relations: this.getReservationRelations(),
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return reservation;
  }

  private isReservationBlocked(status: ReservationStatus) {
    return ![ReservationStatus.CANCELLED, ReservationStatus.NO_SHOW].includes(status);
  }

  private async getBufferedConflicts(
    spaceId: number,
    startTime: Date,
    endTime: Date,
    reservationId?: number,
  ) {
    const bufferStart = this.addMinutes(startTime, -RESERVATION_BUFFER_MINUTES);
    const bufferEnd = this.addMinutes(endTime, RESERVATION_BUFFER_MINUTES);

    const query = this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.space_id = :spaceId', { spaceId })
      .andWhere('reservation.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: [ReservationStatus.CANCELLED, ReservationStatus.NO_SHOW],
      })
      .andWhere('reservation.start_time < :bufferEnd', { bufferEnd })
      .andWhere('reservation.end_time > :bufferStart', { bufferStart });

    if (reservationId) {
      query.andWhere('reservation.reservation_id != :reservationId', { reservationId });
    }

    return query.getMany();
  }

  private async getBlockedSpaceIds(startTime: Date, endTime: Date) {
    const bufferStart = this.addMinutes(startTime, -RESERVATION_BUFFER_MINUTES);
    const bufferEnd = this.addMinutes(endTime, RESERVATION_BUFFER_MINUTES);

    const reservations = await this.reservationRepository
      .createQueryBuilder('reservation')
      .select('reservation.space_id', 'space_id')
      .where('reservation.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: [ReservationStatus.CANCELLED, ReservationStatus.NO_SHOW],
      })
      .andWhere('reservation.start_time < :bufferEnd', { bufferEnd })
      .andWhere('reservation.end_time > :bufferStart', { bufferStart })
      .getRawMany<{ space_id: number }>();

    return new Set(reservations.map((reservation) => Number(reservation.space_id)));
  }

  private isWithinCheckInRadius(latitude: number, longitude: number) {
    const toRadians = (value: number) => (value * Math.PI) / 180;
    const earthRadiusMeters = 6371000;
    const latDelta = toRadians(latitude - OFFICE_LATITUDE);
    const lonDelta = toRadians(longitude - OFFICE_LONGITUDE);
    const startLat = toRadians(OFFICE_LATITUDE);
    const endLat = toRadians(latitude);

    const a =
      Math.sin(latDelta / 2) ** 2 +
      Math.cos(startLat) * Math.cos(endLat) * Math.sin(lonDelta / 2) ** 2;
    const distance = 2 * earthRadiusMeters * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return distance <= CHECK_IN_RADIUS_METERS;
  }

  private async getOverlappingReservations(startTime: Date, endTime: Date) {
    const bufferStart = this.addMinutes(startTime, -RESERVATION_BUFFER_MINUTES);
    const bufferEnd = this.addMinutes(endTime, RESERVATION_BUFFER_MINUTES);

    return this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: [ReservationStatus.CANCELLED, ReservationStatus.NO_SHOW],
      })
      .andWhere('reservation.start_time < :bufferEnd', { bufferEnd })
      .andWhere('reservation.end_time > :bufferStart', { bufferStart })
      .getMany();
  }

  private async getActiveBlocks(startTime: Date, endTime: Date) {
    return this.blockRepository
      .createQueryBuilder('block')
      .leftJoinAndSelect('block.space', 'space')
      .leftJoinAndSelect('block.zone', 'zone')
      .where('block.start_time < :endTime', { endTime })
      .andWhere('(block.end_time IS NULL OR block.end_time > :startTime)', {
        startTime,
      })
      .getMany();
  }

  private isSpaceBlocked(space: Space, startTime: Date, endTime: Date, blocks: Block[]) {
    return blocks.some((block) => {
      const overlaps =
        block.start_time < endTime &&
        (block.end_time === null || block.end_time > startTime);

      const blockedBySpace = block.space_id !== null && block.space_id === space.space_id;
      const blockedByZone = block.zone_id !== null && block.zone_id === space.zone_id;

      return overlaps && (blockedBySpace || blockedByZone);
    });
  }

  private async getAvailableSpacesForRange(startTime: Date, endTime: Date) {
    const spaces = await this.spaceRepository.find({
      relations: ['space_type', 'zone'],
    });
    const activeBlocks = await this.getActiveBlocks(startTime, endTime);
    const reservedSpaceIds = await this.getBlockedSpaceIds(startTime, endTime);

    return spaces.filter(
      (space) =>
        space.status === SpaceStatus.AVAILABLE &&
        !this.isSpaceBlocked(space, startTime, endTime, activeBlocks) &&
        !reservedSpaceIds.has(space.space_id),
    );
  }

  private isParkingSpace(space: Space) {
    return (space.space_type?.name ?? '').toLowerCase().includes('parking');
  }

  private async assertReservationRules(
    reservationData: {
      user_id: number;
      space_id: number;
      start_time: Date;
      end_time: Date;
      reservation_id?: number;
    },
    selectedSpace?: Space,
  ) {
    const space =
      selectedSpace ??
      (await this.spaceRepository.findOne({
        where: { space_id: reservationData.space_id },
        relations: ['space_type', 'zone'],
      }));

    if (!space) {
      throw new BadRequestException('Selected space not found');
    }

    if (space.status !== SpaceStatus.AVAILABLE) {
      throw new ConflictException('Selected space is not available');
    }

    const activeBlocks = await this.getActiveBlocks(reservationData.start_time, reservationData.end_time);

    if (this.isSpaceBlocked(space, reservationData.start_time, reservationData.end_time, activeBlocks)) {
      throw new ConflictException('Selected space is blocked for that time range');
    }

    const conflictingReservation = await this.getBufferedConflicts(
      reservationData.space_id,
      reservationData.start_time,
      reservationData.end_time,
      reservationData.reservation_id,
    );

    if (conflictingReservation.length > 0) {
      throw new ConflictException('Selected space conflicts with an existing reservation or buffer period');
    }

    if (this.isParkingSpace(space)) {
      const parkingConflictQuery = this.reservationRepository
        .createQueryBuilder('reservation')
        .innerJoin('reservation.space', 'space')
        .innerJoin('space.space_type', 'spaceType')
        .where('reservation.user_id = :userId', { userId: reservationData.user_id })
        .andWhere('reservation.status NOT IN (:...excludedStatuses)', {
          excludedStatuses: [ReservationStatus.CANCELLED, ReservationStatus.NO_SHOW],
        })
        .andWhere('reservation.start_time < :bufferEnd', {
          bufferEnd: this.addMinutes(reservationData.end_time, RESERVATION_BUFFER_MINUTES),
        })
        .andWhere('reservation.end_time > :bufferStart', {
          bufferStart: this.addMinutes(reservationData.start_time, -RESERVATION_BUFFER_MINUTES),
        })
        .andWhere('LOWER(spaceType.name) LIKE :parkingType', {
          parkingType: '%parking%',
        });

      if (reservationData.reservation_id) {
        parkingConflictQuery.andWhere('reservation.reservation_id != :reservationId', {
          reservationId: reservationData.reservation_id,
        });
      }

      const parkingConflict = await parkingConflictQuery.getOne();

      if (parkingConflict) {
        throw new ConflictException('You already have a parking reservation that overlaps the requested buffer window');
      }
    }
  }

  async create(createReservationDto: CreateReservationDto) {
    const startTime = new Date(createReservationDto.start_time);
    const endTime = new Date(createReservationDto.end_time);

    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      throw new BadRequestException('Invalid reservation window');
    }

    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    await this.assertReservationRules({
      user_id: createReservationDto.user_id,
      space_id: createReservationDto.space_id,
      start_time: startTime,
      end_time: endTime,
    });

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

  async findAll() {
    await this.markNoShows();
    await this.markCheckoutPending();

    return this.reservationRepository.find({
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

    const mergedReservation = this.reservationRepository.merge(
      existingReservation,
      updateReservationDto,
    );

    if (mergedReservation.status !== ReservationStatus.CANCELLED) {
      const startTime = new Date(mergedReservation.start_time);
      const endTime = new Date(mergedReservation.end_time);
      const selectedSpace = await this.spaceRepository.findOne({
        where: { space_id: mergedReservation.space_id },
        relations: ['space_type', 'zone'],
      });

      if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
        throw new BadRequestException('Invalid reservation window');
      }

      await this.assertReservationRules(
        {
          user_id: mergedReservation.user_id,
          space_id: mergedReservation.space_id,
          start_time: startTime,
          end_time: endTime,
          reservation_id: mergedReservation.reservation_id,
        },
        selectedSpace ?? undefined,
      );
    }

    return this.reservationRepository.save(mergedReservation);
  }

  async remove(id: number) {
    const existingReservation = await this.findOne(id);
    await this.reservationRepository.softRemove(existingReservation);

    return existingReservation;
  }

  async findAvailableTimeSlots(dateValue: string): Promise<TimeSlotAvailability[]> {
    const selectedDate = this.parseLocalDate(dateValue);
    const today = new Date();
    const isToday =
      selectedDate.getFullYear() === today.getFullYear() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getDate() === today.getDate();

    const slots: TimeSlotAvailability[] = [];

    for (let hour = WORKDAY_START_HOUR; hour < WORKDAY_END_HOUR; hour += 1) {
      const { start, end, label } = this.buildTimeLabel(hour);
      const startTime = this.parseLocalTime(dateValue, start);
      const endTime = this.parseLocalTime(dateValue, end);

      const isPast = isToday && startTime < today;

      let availableSpaceCount = 0;

      if (!isPast) {
        availableSpaceCount = (await this.getAvailableSpacesForRange(
          startTime,
          endTime,
        )).length;
      }

      slots.push({
        label,
        start_time: start,
        end_time: end,
        available_space_count: availableSpaceCount,
        is_available: !isPast && availableSpaceCount > 0,
      });
    }

    return slots;
  }

  async findAvailableSpaces(
    dateValue: string,
    startTimeValue: string,
    endTimeValue: string,
  ): Promise<AvailableSpace[]> {
    if (!dateValue || !startTimeValue || !endTimeValue) {
      throw new BadRequestException('Date, start_time and end_time are required');
    }

    const startTime = this.parseLocalTime(dateValue, startTimeValue);
    const endTime = this.parseLocalTime(dateValue, endTimeValue);

    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    const availableSpaces = await this.getAvailableSpacesForRange(
      startTime,
      endTime,
    );

    return availableSpaces.map((space) => ({
      space_id: space.space_id,
      code: space.code,
      is_accessible: space.is_accessible,
      is_priority: space.is_priority,
      status: space.status,
      zone: space.zone ? { name: space.zone.name } : null,
      space_type: space.space_type ? { name: space.space_type.name } : null,
    }));
  }

  async createSpecialEventReservations(createSpecialEventDto: CreateSpecialEventDto) {
    const startTime = new Date(createSpecialEventDto.start_time);
    const endTime = new Date(createSpecialEventDto.end_time);

    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      throw new BadRequestException('Invalid event window');
    }

    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    const spacesInZone = await this.spaceRepository.find({
      where: { zone_id: createSpecialEventDto.zone_id },
      relations: ['space_type', 'zone'],
    });

    const activeBlocks = await this.getActiveBlocks(startTime, endTime);
    const blockedSpaces = spacesInZone.filter((space) =>
      this.isSpaceBlocked(space, startTime, endTime, activeBlocks),
    );

    const reservableSpaces = spacesInZone.filter(
      (space) => space.status === SpaceStatus.AVAILABLE && !blockedSpaces.includes(space),
    );

    const conflictingReservations = await this.reservationRepository
      .createQueryBuilder('reservation')
      .innerJoin('reservation.space', 'space')
      .where('space.zone_id = :zoneId', { zoneId: createSpecialEventDto.zone_id })
      .andWhere('reservation.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: [ReservationStatus.CANCELLED, ReservationStatus.NO_SHOW],
      })
      .andWhere('reservation.start_time < :endTime', { endTime })
      .andWhere('reservation.end_time > :startTime', { startTime })
      .getMany();

    if (conflictingReservations.length > 0) {
      await this.reservationRepository.save(
        conflictingReservations.map((reservation) => ({
          reservation_id: reservation.reservation_id,
          status: ReservationStatus.CANCELLED,
        })),
      );
    }

    const newReservations = reservableSpaces.map((space) =>
      this.reservationRepository.create({
        start_time: createSpecialEventDto.start_time,
        end_time: createSpecialEventDto.end_time,
        status: ReservationStatus.RESERVED,
        user_id: createSpecialEventDto.user_id,
        space_id: space.space_id,
      }),
    );

    const savedReservations = await this.reservationRepository.save(newReservations);

    return {
      title: createSpecialEventDto.title,
      zone_id: createSpecialEventDto.zone_id,
      createdReservations: savedReservations.length,
      cancelledReservations: conflictingReservations.length,
      blockedSpaces: blockedSpaces.length,
    };
  }

  async findByUser(userId: number) {
    return this.reservationRepository.find({
      where: { user_id: userId },
      relations: this.getReservationRelations(),
      order: {
        start_time: 'DESC',
      },
    });
  }

  async findReservationHistory(userId: number | null, isAdmin = false) {
    await this.markNoShows();
    await this.markCheckoutPending();

    const reservations = await this.reservationRepository.find({
      where: isAdmin || userId === null ? undefined : { user_id: userId },
      relations: this.getReservationRelations(),
      order: {
        start_time: 'DESC',
      },
    });

    return reservations.filter((reservation) => HISTORY_RESERVATION_STATUSES.includes(reservation.status));
  }

  async findActiveReservations(userId: number | null, isAdmin = false) {
    await this.markNoShows();
    await this.markCheckoutPending();

    const where = isAdmin || userId === null ? undefined : { user_id: userId };

    return this.reservationRepository.find({
      where,
      relations: this.getReservationRelations(),
      order: {
        start_time: 'DESC',
      },
    }).then((reservations) =>
      reservations.filter((reservation) => ACTIVE_RESERVATION_STATUSES.includes(reservation.status)),
    );
  }

  async checkIn(
    reservationId: number,
    userId: number,
    location?: CheckInLocation,
  ) {
    const reservation = await this.findReservationOrThrow(reservationId);
    this.assertOwnerOrAdmin(reservation, userId, { isAdmin: location?.isAdmin });

    if (reservation.status === ReservationStatus.CHECKED_IN) {
      throw new ConflictException('Reservation is already checked in');
    }

    if (reservation.status === ReservationStatus.CHECKED_OUT) {
      throw new ConflictException('Reservation has already been checked out');
    }

    if (reservation.status === ReservationStatus.CANCELLED) {
      throw new ConflictException('Cancelled reservations cannot be checked in');
    }

    await this.markNoShows();
    const refreshedReservation = await this.findReservationOrThrow(reservationId);

    if (refreshedReservation.status === ReservationStatus.NO_SHOW) {
      throw new ConflictException('Reservation is already marked as no-show');
    }

    const now = new Date();
    const windowStart = this.addMinutes(refreshedReservation.start_time, -CHECK_IN_WINDOW_BEFORE_MINUTES);
    const windowEnd = this.addMinutes(refreshedReservation.start_time, CHECK_IN_WINDOW_AFTER_MINUTES);

    if (now < windowStart || now > windowEnd) {
      throw new ConflictException(
        'Check-in is only available from 15 minutes before to 20 minutes after the reservation start time',
      );
    }

    if (location?.latitude === undefined || location?.longitude === undefined) {
      throw new BadRequestException('Latitude and longitude are required for check-in');
    }

    if (!this.isWithinCheckInRadius(location.latitude, location.longitude)) {
      throw new ConflictException('You are too far from the office to check in');
    }

    refreshedReservation.status = ReservationStatus.CHECKED_IN;
    refreshedReservation.check_in_time = now;
    refreshedReservation.latitude_check_in = location.latitude;
    refreshedReservation.longitude_check_in = location.longitude;

    const savedReservation = await this.reservationRepository.save(refreshedReservation);

    return this.findReservationOrThrow(savedReservation.reservation_id);
  }

  async checkOut(reservationId: number, userId: number, actor?: ActorContext) {
    const reservation = await this.findReservationOrThrow(reservationId);
    this.assertOwnerOrAdmin(reservation, userId, actor);

    if (![ReservationStatus.CHECKED_IN, ReservationStatus.CHECKOUT_PENDING].includes(reservation.status)) {
      throw new ConflictException('Only checked-in reservations can be checked out');
    }

    reservation.status = ReservationStatus.CHECKED_OUT;
    reservation.check_out_time = new Date();

    const savedReservation = await this.reservationRepository.save(reservation);

    return this.findReservationOrThrow(savedReservation.reservation_id);
  }

  async extendReservation(
    reservationId: number,
    userId: number,
    newEndTimeValue: string,
    actor?: ActorContext,
  ) {
    const reservation = await this.findReservationOrThrow(reservationId);
    this.assertOwnerOrAdmin(reservation, userId, actor);

    if ([ReservationStatus.CANCELLED, ReservationStatus.NO_SHOW, ReservationStatus.CHECKED_OUT].includes(reservation.status)) {
      throw new ConflictException('This reservation can no longer be extended');
    }

    const newEndTime = new Date(newEndTimeValue);

    if (Number.isNaN(newEndTime.getTime())) {
      throw new BadRequestException('Invalid end time');
    }

    if (newEndTime <= reservation.end_time) {
      throw new BadRequestException('New end time must be after the current end time');
    }

    await this.assertReservationRules(
      {
        user_id: reservation.user_id,
        space_id: reservation.space_id,
        start_time: reservation.start_time,
        end_time: newEndTime,
        reservation_id: reservation.reservation_id,
      },
      reservation.space,
    );

    reservation.end_time = newEndTime;
    const savedReservation = await this.reservationRepository.save(reservation);

    return this.findReservationOrThrow(savedReservation.reservation_id);
  }

  async findAlternativeSpace(
    spaceId: number,
    startTime: Date,
    endTime: Date,
    reservationId?: number,
  ) {
    const sourceSpace = await this.spaceRepository.findOne({
      where: { space_id: spaceId },
      relations: ['space_type', 'zone'],
    });

    if (!sourceSpace?.space_type?.name) {
      return null;
    }

    const candidateSpaces = await this.spaceRepository.find({
      relations: ['space_type', 'zone'],
    });

    const activeBlocks = await this.getActiveBlocks(startTime, endTime);
    const blockedSpaceIds = await this.getBlockedSpaceIds(startTime, endTime);

    return (
      candidateSpaces.find((candidate) => {
        if (candidate.space_id === spaceId) {
          return false;
        }

        const sameType = (candidate.space_type?.name ?? '').toLowerCase() === sourceSpace.space_type!.name.toLowerCase();
        const available =
          candidate.status === SpaceStatus.AVAILABLE &&
          !this.isSpaceBlocked(candidate, startTime, endTime, activeBlocks) &&
          !blockedSpaceIds.has(candidate.space_id);

        return sameType && available;
      }) ?? null
    );
  }

  async reportIncident(
    reservationId: number,
    userId: number,
    dto: ReportIncidentDto,
    actor?: ActorContext,
  ) {
    const reservation = await this.findReservationOrThrow(reservationId);
    this.assertOwnerOrAdmin(reservation, userId, actor);

    const previousReservation = await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.space_id = :spaceId', { spaceId: reservation.space_id })
      .andWhere('reservation.reservation_id != :reservationId', { reservationId })
      .andWhere('reservation.end_time < :startTime', { startTime: reservation.start_time })
      .orderBy('reservation.end_time', 'DESC')
      .getOne();

    const alternativeSpace = await this.findAlternativeSpace(
      reservation.space_id,
      reservation.start_time,
      reservation.end_time,
      reservation.reservation_id,
    );

    const incident = this.reservationRepository.manager.getRepository(Incident).create({
      reservation_id: reservation.reservation_id,
      reported_by: userId,
      space_id: reservation.space_id,
      previous_reservation_id: previousReservation?.reservation_id ?? null,
      type: dto.type,
      description: dto.notes ? `${dto.description} ${dto.notes}` : dto.description,
      status: IncidentStatus.OPEN,
    });

    const savedIncident = await this.reservationRepository.manager.getRepository(Incident).save(incident);

    reservation.status = ReservationStatus.INCIDENT;
    reservation.incident_notes = dto.notes ? `${dto.description} ${dto.notes}` : dto.description;
    if (alternativeSpace) {
      reservation.reassigned_space_id = alternativeSpace.space_id;
    }

    await this.reservationRepository.save(reservation);

    return {
      incident: savedIncident,
      alternative_space: alternativeSpace
        ? {
            space_id: alternativeSpace.space_id,
            code: alternativeSpace.code,
            is_accessible: alternativeSpace.is_accessible,
            is_priority: alternativeSpace.is_priority,
            status: alternativeSpace.status,
            zone: alternativeSpace.zone ? { name: alternativeSpace.zone.name } : null,
            space_type: alternativeSpace.space_type ? { name: alternativeSpace.space_type.name } : null,
          }
        : null,
      reservation: await this.findReservationOrThrow(reservation.reservation_id),
    };
  }

  async markNoShows() {
    const cutoff = this.addMinutes(new Date(), -CHECK_IN_WINDOW_AFTER_MINUTES);
    const reservations = await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.status = :status', { status: ReservationStatus.RESERVED })
      .andWhere('reservation.start_time < :cutoff', { cutoff })
      .getMany();

    if (reservations.length === 0) {
      return [];
    }

    reservations.forEach((reservation) => {
      reservation.status = ReservationStatus.NO_SHOW;
      reservation.no_show_at = this.addMinutes(reservation.start_time, CHECK_IN_WINDOW_AFTER_MINUTES);
    });

    await this.reservationRepository.save(reservations);

    return reservations;
  }

  async markCheckoutPending() {
    const now = new Date();
    const reservations = await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.status = :status', { status: ReservationStatus.CHECKED_IN })
      .andWhere('reservation.end_time < :now', { now })
      .getMany();

    if (reservations.length === 0) {
      return [];
    }

    reservations.forEach((reservation) => {
      reservation.status = ReservationStatus.CHECKOUT_PENDING;
    });

    await this.reservationRepository.save(reservations);

    return reservations;
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, LessThanOrEqual, Repository } from 'typeorm';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { Space, SpaceStatus } from '../space/entities/space.entity';
import { Incident, IncidentStatus, IncidentType } from './entities/incident.entity';
import { CreateSpecialEventDto } from './dto/create-special-event.dto';
import { ReportIncidentDto } from './dto/report-incident.dto';
import { Block } from '../block/entities/block.entity';
import { GamificationService } from '../gamification/gamification.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationReason } from '../notifications/entities/notification.entity';
import { Event, EventStatus } from '../event/entities/event.entity';
import { Guest } from './entities/guest.entity';

const NO_SHOW_GRACE_PERIOD_MINUTES = 20;
const OVERSTAY_EXTENSION_MS = 60 * 60 * 1000; // 1 hour
const OVERSTAY_PENALTY_POINTS = 10;
const OFFICE_CLOSING_HOUR = 19; // 7 PM
const MONTERREY_TIME_ZONE = 'America/Monterrey';
type SpaceTypeGroup = 'desk' | 'meeting' | 'parking' | 'other';

@Injectable()
export class ReservationService implements OnModuleInit {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(Space)
    private readonly spaceRepository: Repository<Space>,
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,
    private readonly gamificationService: GamificationService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async sendReservationNotification(params: {
    userId: number;
    reason: NotificationReason;
    title: string;
    content: string;
  }) {
    try {
      await this.notificationsService.create({
        user_id: params.userId,
        reason: params.reason,
        title: params.title,
        content: params.content,
      });
    } catch (error) {
      console.error('[NOTIFICATION ERROR]', error);
    }
  }

  private formatReservationDateTime(value: Date | string | null | undefined) {
    if (!value) {
      return 'Horario no disponible';
    }

    const parsedValue = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(parsedValue.getTime())) {
      return 'Horario no disponible';
    }

    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: MONTERREY_TIME_ZONE,
    }).format(parsedValue);
  }

  private buildReservationSummary(reservation: {
    start_time?: Date | string | null;
    end_time?: Date | string | null;
    space_id?: number | null;
    space?: { code?: string | null } | null;
  }) {
    const spaceLabel = reservation.space?.code
      ? reservation.space.code
      : reservation.space_id
        ? `Espacio ${reservation.space_id}`
        : 'Espacio no disponible';
    const startLabel = this.formatReservationDateTime(reservation.start_time);
    const endLabel = this.formatReservationDateTime(reservation.end_time);

    return `Espacio: ${spaceLabel}. Horario: ${startLabel} - ${endLabel}.`;
  }

  private getSpaceTypeGroup(
    space?: { space_type?: { name?: string | null } | null } | null,
  ): SpaceTypeGroup {
    const name = (space?.space_type?.name ?? '').toLowerCase();

    if (name.includes('parking') || name.includes('estacionamiento')) {
      return 'parking';
    }

    if (
      name.includes('desk') ||
      name.includes('escritorio') ||
      name.includes('escritorios')
    ) {
      return 'desk';
    }

    if (
      name.includes('room') ||
      name.includes('sala') ||
      name.includes('meeting') ||
      name.includes('juntas')
    ) {
      return 'meeting';
    }

    return 'other';
  }

  private overlapsReservationWindow(
    reservation: {
      start_time: Date | string;
      end_time: Date | string;
      check_out_time?: Date | string | null;
      status: ReservationStatus;
    },
    start: Date,
    end: Date,
  ) {
    const reservationStart = new Date(reservation.start_time);
    const reservationEnd =
      reservation.status === ReservationStatus.CHECKED_OUT &&
      reservation.check_out_time
        ? new Date(reservation.check_out_time)
        : new Date(reservation.end_time);

    return reservationStart < end && reservationEnd > start;
  }

  private async getUserActiveReservationsWithSpace(userId: number) {
    return this.reservationRepository.find({
      where: {
        user_id: userId,
        status: In([
          ReservationStatus.RESERVED,
          ReservationStatus.CHECKED_IN,
          ReservationStatus.CHECKOUT_PENDING,
          // INCIDENT excluded: users with an incident must be able to select
          // alternative spaces of the same type without being blocked
        ]),
        // Excluir sub-reservas de invitados (tienen parent_reservation_id)
        // y reservas creadas en nombre de un invitado (is_guest_reservation)
        // para no bloquear al usuario de reservar su propio espacio
        parent_reservation_id: IsNull(),
        is_guest_reservation: false,
      },
      relations: ['space', 'space.space_type'],
      order: {
        start_time: 'ASC',
      },
    });
  }

  private getReservedSpaceTypesForWindow(
    reservations: Array<{
      start_time: Date | string;
      end_time: Date | string;
      check_out_time?: Date | string | null;
      status: ReservationStatus;
      space: { space_type?: { name?: string | null } | null };
    }>,
    start: Date,
    end: Date,
  ) {
    const reservedTypes = new Set<SpaceTypeGroup>();

    for (const reservation of reservations) {
      if (!this.overlapsReservationWindow(reservation, start, end)) {
        continue;
      }

      const group = this.getSpaceTypeGroup(reservation.space);
      if (group !== 'other') {
        reservedTypes.add(group);
      }
    }

    return reservedTypes;
  }

  private async assertUserDoesNotHaveConflictingSpaceTypeReservation(
    userId: number,
    requestedSpace: { space_type?: { name?: string | null } | null },
    start: Date,
    end: Date,
    options?: { allowMultipleParking?: boolean },
  ) {
    const requestedGroup = this.getSpaceTypeGroup(requestedSpace);

    if (requestedGroup === 'other') {
      return;
    }

    // If requested group is 'parking' and caller explicitly allows multiple parking
    // allocations (for example when creating extra parking spaces), skip the conflict check.
    if (requestedGroup === 'parking' && options?.allowMultipleParking) {
      return;
    }

    const activeReservations =
      await this.getUserActiveReservationsWithSpace(userId);
    const reservedTypes = this.getReservedSpaceTypesForWindow(
      activeReservations,
      start,
      end,
    );

    if (reservedTypes.has(requestedGroup)) {
      throw new BadRequestException(
        'Ya tienes una reservación activa de este tipo en ese horario.',
      );
    }
  }

  async onModuleInit() {
    console.log('[SERVER START] Processing pending reservations...');
    // First, process any reservations that ended while server was down (attempt extension or close)
    await this.handleEndedReservations();
    // Then, close any orphaned reservations that are still in CHECKOUT_PENDING
    await this.recoverOrphanedReservations();
    console.log('[SERVER START] Reservation processing complete');
  }

  private async recoverOrphanedReservations() {
    try {
      const orphanedReservations = await this.reservationRepository
        .createQueryBuilder('reservation')
        .where('reservation.status = :status', {
          status: ReservationStatus.CHECKOUT_PENDING,
        })
        .andWhere('reservation.check_out_time IS NULL')
        .andWhere('reservation.end_time <= :now', { now: new Date() })
        .getMany();

      if (orphanedReservations.length > 0) {
        for (const reservation of orphanedReservations) {
          reservation.status = ReservationStatus.CHECKED_OUT;
          reservation.check_out_time = new Date(reservation.end_time);
          reservation.auto_checked_out = true;
          await this.reservationRepository.save(reservation);

          console.log(
            `[SERVER START RECOVERY] Closed orphaned reservation ${reservation.reservation_id} (user ${reservation.user_id})`,
          );
        }
      }
    } catch (err) {
      console.error('[SERVER START RECOVERY ERROR]', err);
    }
  }

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
      'guests',
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

  private assertOwnerOrAdmin(
    reservation: Reservation,
    userId: number,
    isAdmin?: boolean,
  ) {
    if (!isAdmin && reservation.user_id !== userId) {
      throw new ForbiddenException('You can only act on your own reservations');
    }
  }

  private async assertSpaceIsAvailable(
    spaceId: number,
    start: Date,
    end: Date,
    reservationIdToIgnore?: number,
  ) {
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
      .andWhere('(block.end_time IS NULL OR block.end_time > :start)', {
        start,
      })
      .getExists();

    if (hasBlockingRecord) {
      throw new BadRequestException(
        'This space is blocked for the selected time range',
      );
    }

    // If requested slot already started, evaluate overlap from now onwards.
    // This allows rebooking the remainder of the slot after an early checkout.
    const overlapStart = start < new Date() ? new Date() : start;

    const overlappingReservationQuery = this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.space_id = :spaceId', { spaceId })
      .andWhere('reservation.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: [
          ReservationStatus.CANCELLED,
          ReservationStatus.NO_SHOW,
        ],
      })
      .andWhere('reservation.start_time < :end', { end })
      .andWhere(
        `COALESCE(
          CASE
            WHEN reservation.status = :checkedOutStatus THEN reservation.check_out_time
            WHEN reservation.status = :incidentStatus AND reservation.check_out_time IS NOT NULL
              THEN reservation.check_out_time
          END,
          reservation.end_time
        ) > :start`,
        {
          start: overlapStart,
          checkedOutStatus: ReservationStatus.CHECKED_OUT,
          incidentStatus: ReservationStatus.INCIDENT,
        },
      );

    if (reservationIdToIgnore !== undefined) {
      overlappingReservationQuery.andWhere(
        'reservation.reservation_id != :reservationIdToIgnore',
        {
          reservationIdToIgnore,
        },
      );
    }

    const hasOverlappingReservation =
      await overlappingReservationQuery.getExists();

    if (hasOverlappingReservation) {
      throw new BadRequestException(
        'This space already has a reservation for the selected time range',
      );
    }
  }

  private async markExpiredReservationsAsNoShow(now = new Date()) {
    const noShowThreshold = new Date(
      now.getTime() - NO_SHOW_GRACE_PERIOD_MINUTES * 60 * 1000,
    );

    const expiredReservations = await this.reservationRepository
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.space', 'space')
      .where('reservation.status = :status', {
        status: ReservationStatus.RESERVED,
      })
      .andWhere('check_in_time IS NULL')
      .andWhere('no_show_at IS NULL')
      .andWhere('reservation.start_time <= :noShowThreshold', {
        noShowThreshold,
      })
      .getMany();

    for (const reservation of expiredReservations) {
      reservation.status = ReservationStatus.NO_SHOW;
      reservation.no_show_at = now;

      await this.reservationRepository.save(reservation);

      await this.sendReservationNotification({
        userId: reservation.user_id,
        reason: NotificationReason.NO_SHOW,
        title: 'Reservación marcada como no-show',
        content: `${
          reservation.event_id
            ? 'Tu reservación asociada a un evento fue marcada como no-show por no presentarte a tiempo.'
            : 'Tu reservación fue marcada como no-show por no presentarte a tiempo.'
        } ${this.buildReservationSummary(reservation)}`,
      });
    }
  }

  async create(createReservationDto: CreateReservationDto) {
    // Parse dates
    const startTime = new Date(createReservationDto.start_time);
    const endTime = new Date(createReservationDto.end_time);

    // Validate date format
    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      throw new BadRequestException(
        'Invalid date-time format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
      );
    }

    // Validate end time > start time
    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    // Validate the reservation still has future time left
    const now = new Date();
    if (endTime <= now) {
      throw new BadRequestException(
        `Cannot reserve a time range that already ended. Current time: ${now.toISOString()}, requested end: ${endTime.toISOString()}`,
      );
    }

    await this.assertSpaceIsAvailable(
      createReservationDto.space_id,
      startTime,
      endTime,
    );

    const requestedSpace = await this.spaceRepository.findOne({
      where: { space_id: createReservationDto.space_id },
      relations: ['space_type'],
    });

    if (!requestedSpace) {
      throw new NotFoundException('Space not found');
    }

    // Use a typed alias for optional payload fields to satisfy static analyzer
    const payload = createReservationDto as unknown as {
      extra_parking_space_ids?: number[];
      guests?: { name: string; email?: string }[];
      is_guest_reservation?: boolean;
    };

    const isGuestReservation = payload.is_guest_reservation === true;

    const allowMultipleParking =
      Array.isArray(payload.extra_parking_space_ids) &&
      payload.extra_parking_space_ids.length > 0;

    // Guest reservations are created on behalf of a visitor and must not
    // count against the host's own space-type quota
    if (!isGuestReservation) {
      await this.assertUserDoesNotHaveConflictingSpaceTypeReservation(
        createReservationDto.user_id,
        requestedSpace,
        startTime,
        endTime,
        { allowMultipleParking },
      );
    }

    const newReservation = this.reservationRepository.create({
      ...createReservationDto,
      status: ReservationStatus.RESERVED,
      check_in_time: null,
      check_out_time: null,
      no_show_at: null,
      incident_notes: null,
      reassigned_space_id: null,
      latitude_check_in: null,
      longitude_check_in: null,
    });

    const savedReservation =
      await this.reservationRepository.save(newReservation);

    const reservedSpace = await this.spaceRepository.findOne({
      where: { space_id: savedReservation.space_id },
    });

    await this.sendReservationNotification({
      userId: savedReservation.user_id,
      reason: NotificationReason.RESERVATION_SUCCESS,
      title: savedReservation.event_id
        ? 'Reserva para evento confirmada'
        : 'Reserva confirmada',
      content: savedReservation.event_id
        ? `Tu reservación vinculada a un evento fue creada correctamente. ${this.buildReservationSummary(
            {
              start_time: savedReservation.start_time,
              end_time: savedReservation.end_time,
              space_id: savedReservation.space_id,
              space: reservedSpace,
            },
          )}`
        : `Tu reservación fue creada correctamente. ${this.buildReservationSummary(
            {
              start_time: savedReservation.start_time,
              end_time: savedReservation.end_time,
              space_id: savedReservation.space_id,
              space: reservedSpace,
            },
          )}`,
    });

    // Persist any guests attached to the reservation DTO
    const guests = payload.guests;
    type GuestInput = {
      name: string;
      email?: string;
      extra_parking_space_id?: number;
    };
    const guestType = guests as unknown as GuestInput[] | undefined;

    if (Array.isArray(guestType) && guestType.length > 0) {
      for (let gIdx = 0; gIdx < guestType.length; gIdx++) {
        const g = guestType[gIdx];
        try {
          await this.guestRepository.save(
            this.guestRepository.create({
              reservation_id: savedReservation.reservation_id,
              name: g.name,
              email: g.email ?? null,
            }),
          );

          // If guest requested extra parking, create a reservation for that space
          if (g.extra_parking_space_id) {
            const guestParkingSpaceId = g.extra_parking_space_id;

            if (guestParkingSpaceId === savedReservation.space_id) {
              throw new BadRequestException(
                `Guest ${g.name}: cannot request the same space as extra parking`,
              );
            }

            const guestParkingSpace = await this.spaceRepository.findOne({
              where: { space_id: guestParkingSpaceId },
              relations: ['space_type'],
            });
            if (!guestParkingSpace) {
              throw new NotFoundException(
                `Extra parking space ${guestParkingSpaceId} for guest ${g.name} not found`,
              );
            }

            const parkingGroup = this.getSpaceTypeGroup(guestParkingSpace);
            if (parkingGroup !== 'parking') {
              throw new BadRequestException(
                `Space ${guestParkingSpaceId} for guest ${g.name} is not a parking space`,
              );
            }

            await this.assertSpaceIsAvailable(
              guestParkingSpaceId,
              startTime,
              endTime,
            );

            const guestParkingReservation = this.reservationRepository.create({
              start_time: startTime,
              end_time: endTime,
              code: `${savedReservation.code}-G-${gIdx + 1}`,
              user_id: savedReservation.user_id,
              space_id: guestParkingSpaceId,
              parent_reservation_id: savedReservation.reservation_id,
              status: ReservationStatus.RESERVED,
              check_in_time: null,
              check_out_time: null,
              no_show_at: null,
              incident_notes: null,
              reassigned_space_id: null,
              latitude_check_in: null,
              longitude_check_in: null,
            });

            const savedGuestParking = await this.reservationRepository.save(
              guestParkingReservation,
            );

            // Link guest info to the parking sub-reservation so it shows in history
            const parkingReservationId = Number(
              savedGuestParking.reservation_id,
            );
            await this.guestRepository.save(
              this.guestRepository.create({
                reservation_id: parkingReservationId,
                name: g.name,
                email: g.email ?? null,
              }),
            );

            const userId = savedReservation.user_id;
            await this.sendReservationNotification({
              userId: typeof userId === 'number' ? userId : -1,
              reason: NotificationReason.RESERVATION_SUCCESS,
              title: 'Estacionamiento adicional para invitado reservado',
              content: `Se asignó el espacio de estacionamiento ${savedGuestParking.space_id} para el invitado ${g.name} en ${this.buildReservationSummary(
                savedGuestParking,
              )}.`,
            });
          }
        } catch (err) {
          console.error('[GUEST SAVE ERROR]', err);
        }
      }
    }

    // If the client requested extra parking spaces, allocate them as separate reservations.
    const extraIds: number[] | undefined = payload.extra_parking_space_ids;

    if (Array.isArray(extraIds) && extraIds.length > 0) {
      // Validate availability for all extra parking spaces before creating any.
      for (const extraSpaceId of extraIds) {
        if (extraSpaceId === savedReservation.space_id) {
          throw new BadRequestException(
            'Cannot request the same space as extra parking',
          );
        }

        const extraSpace = await this.spaceRepository.findOne({
          where: { space_id: extraSpaceId },
          relations: ['space_type'],
        });
        if (!extraSpace) {
          throw new NotFoundException(
            `Extra parking space ${extraSpaceId} not found`,
          );
        }

        const group = this.getSpaceTypeGroup(extraSpace);
        if (group !== 'parking') {
          throw new BadRequestException(
            `Space ${extraSpaceId} is not a parking space`,
          );
        }

        await this.assertSpaceIsAvailable(extraSpaceId, startTime, endTime);
      }

      const createdExtras: Reservation[] = [];

      for (let i = 0; i < extraIds.length; i++) {
        const extraSpaceId = extraIds[i];

        const extraReservation = this.reservationRepository.create({
          start_time: startTime,
          end_time: endTime,
          code: `${savedReservation.code}-P-${i + 1}`,
          user_id: savedReservation.user_id,
          space_id: extraSpaceId,
          parent_reservation_id: savedReservation.reservation_id,
          status: ReservationStatus.RESERVED,
          check_in_time: null,
          check_out_time: null,
          no_show_at: null,
          incident_notes: null,
          reassigned_space_id: null,
          latitude_check_in: null,
          longitude_check_in: null,
        });

        const savedExtra =
          await this.reservationRepository.save(extraReservation);

        createdExtras.push(savedExtra);
        const extraUserId = savedExtra.user_id as number;

        await this.sendReservationNotification({
          userId: extraUserId,
          reason: NotificationReason.RESERVATION_SUCCESS,
          title: 'Espacio de estacionamiento adicional reservado',
          content: `Se te asignó el espacio de estacionamiento ${savedExtra.space_id} para ${this.buildReservationSummary(
            savedExtra,
          )}.`,
        });
      }

      // Optionally include created extras in the response for the client.
      return {
        main: savedReservation,
        extras: createdExtras,
      } as unknown as Reservation;
    }

    return savedReservation;
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
    await this.markExpiredReservationsAsNoShow();

    const statuses = [
      ReservationStatus.RESERVED,
      ReservationStatus.CHECKED_IN,
      ReservationStatus.CHECKOUT_PENDING,
      ReservationStatus.INCIDENT,
    ];

    const query = this.reservationRepository
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.user', 'user')
      .leftJoinAndSelect('reservation.space', 'space')
      .leftJoinAndSelect('space.space_type', 'spaceType')
      .leftJoinAndSelect('space.zone', 'zone')
      .leftJoinAndSelect('reservation.release', 'release')
      .leftJoinAndSelect('reservation.event', 'event')
      .leftJoinAndSelect('reservation.checkEvents', 'checkEvents')
      .leftJoinAndSelect('reservation.incidents', 'incidents')
      .where('reservation.status IN (:...statuses)', { statuses })
      .andWhere('reservation.end_time > CURRENT_TIMESTAMP')
      .orderBy(
        'ABS(EXTRACT(EPOCH FROM (reservation.start_time - CURRENT_TIMESTAMP)))',
        'ASC',
      )
      .addOrderBy('reservation.start_time', 'ASC');

    if (!isAdmin) {
      query.andWhere('reservation.user_id = :userId', { userId: userId ?? -1 });
    }

    return query.getMany();
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async syncNoShowReservations() {
    await this.markExpiredReservationsAsNoShow();
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async syncEndOfReservations() {
    await this.handleEndedReservations();
  }

  @Cron('0 19-23 * * *') // Every hour from 7 PM to 11 PM, as a safety measure
  async syncOfficeClosing() {
    await this.handleOfficeClosing();
  }

  private async handleEndedReservations(now = new Date()) {
    const endedReservations = await this.reservationRepository.find({
      where: [
        {
          status: In([
            ReservationStatus.RESERVED,
            ReservationStatus.CHECKED_IN,
          ]),
          check_out_time: IsNull(),
          end_time: LessThanOrEqual(now),
        },
        {
          status: ReservationStatus.CHECKOUT_PENDING,
          check_out_time: IsNull(),
          end_time: LessThanOrEqual(now),
        },
      ],
      relations: ['user', 'space'],
    });

    for (const reservation of endedReservations) {
      // A reservation already extended once (CHECKOUT_PENDING) and still not
      // checked out: close it and penalize for not checking out at all.
      if (reservation.status === ReservationStatus.CHECKOUT_PENDING) {
        reservation.status = ReservationStatus.CHECKED_OUT;
        reservation.check_out_time = new Date(reservation.end_time);
        reservation.auto_checked_out = true;
        await this.reservationRepository.save(reservation);

        await this.sendReservationNotification({
          userId: reservation.user_id,
          reason: NotificationReason.CHECKOUT_PENDING,
          title: 'Reservación cerrada automáticamente',
          content: `Tu reservación se cerró automáticamente porque no hiciste checkout a tiempo, ni durante la extensión otorgada. Esto afecta tus puntos de gamificación. ${this.buildReservationSummary(reservation)}`,
        });

        continue;
      }

      try {
        const proposedStart = new Date(reservation.end_time);
        const proposedEnd = new Date(
          proposedStart.getTime() + OVERSTAY_EXTENSION_MS,
        );

        // If the space is available for an extra hour, apply extension and penalty
        await this.assertSpaceIsAvailable(
          reservation.space_id,
          proposedStart,
          proposedEnd,
          reservation.reservation_id,
        );

        reservation.end_time = proposedEnd;
        reservation.status = ReservationStatus.CHECKOUT_PENDING;

        await this.reservationRepository.save(reservation);

        await this.sendReservationNotification({
          userId: reservation.user_id,
          reason: NotificationReason.CHECKOUT_PENDING,
          title: 'Checkout pendiente',
          content: `Tu reservación terminó y quedó en checkout pendiente. Al parecer el espacio sigue disponible, se extendió la reservación una hora más; si no la necesitas, finalízala desde el checkout. ${this.buildReservationSummary(reservation)}`,
        });

        try {
          await this.gamificationService.applyPenalty(
            reservation.user_id,
            OVERSTAY_PENALTY_POINTS,
            reservation.reservation_id,
          );
        } catch {
          // Log and continue; penalty is best-effort
        }
      } catch {
        // Could not extend due to overlap/block; finalize as checked out
        reservation.status = ReservationStatus.CHECKED_OUT;
        reservation.check_out_time = new Date(reservation.end_time);
        reservation.auto_checked_out = true;
        await this.reservationRepository.save(reservation);
      }
    }
  }

  private async handleOfficeClosing(now = new Date()) {
    // Calculate today's boundaries (00:00 to 23:59)
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const closingTime = new Date(now);
    closingTime.setHours(OFFICE_CLOSING_HOUR, 0, 0, 0);

    // Get all active reservations that started today and haven't been checked out yet
    const activeReservations = await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.status IN (:...statuses)', {
        statuses: [
          ReservationStatus.RESERVED,
          ReservationStatus.CHECKED_IN,
          ReservationStatus.CHECKOUT_PENDING,
        ],
      })
      .andWhere('reservation.check_out_time IS NULL')
      .andWhere('reservation.start_time >= :today', { today })
      .andWhere('reservation.start_time < :tomorrow', { tomorrow })
      .leftJoinAndSelect('reservation.user', 'user')
      .getMany();

    for (const reservation of activeReservations) {
      try {
        reservation.status = ReservationStatus.CHECKED_OUT;
        reservation.check_out_time = closingTime;
        reservation.auto_checked_out = true;

        await this.reservationRepository.save(reservation);

        console.log(
          `[OFFICE CLOSING] Reservation ${reservation.reservation_id} for user ${reservation.user_id} closed at office closing time (${closingTime.toISOString()})`,
        );
      } catch (err) {
        console.error(
          `[OFFICE CLOSING ERROR] Failed to close reservation ${reservation.reservation_id}:`,
          err,
        );
      }
    }
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

  async findAvailableSpaces(
    date: string,
    startTime: string,
    endTime: string,
    userId: number | null = null,
  ) {
    const start = this.parseDateTime(date, startTime);
    const end = this.parseDateTime(date, endTime);

    if (end <= start) {
      throw new BadRequestException('End time must be after start time');
    }

    // Same overlap rule as reservation creation: for in-progress slots, compute
    // availability from current time to avoid blocking due to past occupied minutes.
    const overlapStart = start < new Date() ? new Date() : start;

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
        excludedStatuses: [
          ReservationStatus.CANCELLED,
          ReservationStatus.NO_SHOW,
        ],
      })
      .andWhere('reservation.start_time < :end', { end })
      .andWhere(
        `COALESCE(
          CASE
            WHEN reservation.status = :checkedOutStatus THEN reservation.check_out_time
            WHEN reservation.status = :incidentStatus AND reservation.check_out_time IS NOT NULL
              THEN reservation.check_out_time
          END,
          reservation.end_time
        ) > :start`,
        {
          start: overlapStart,
          checkedOutStatus: ReservationStatus.CHECKED_OUT,
          incidentStatus: ReservationStatus.INCIDENT,
        },
      )
      .getRawMany<{ space_id: number }>();

    const occupiedIds = new Set<number>(
      overlappingReservations.map((item) => Number(item.space_id)),
    );

    const overlappingBlocks = await this.blockRepository
      .createQueryBuilder('block')
      .select('block.space_id', 'space_id')
      .addSelect('block.zone_id', 'zone_id')
      .where('block.start_time < :end', { end })
      .andWhere('(block.end_time IS NULL OR block.end_time > :start)', {
        start,
      })
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

    const reservedSpaceTypes = userId
      ? this.getReservedSpaceTypesForWindow(
          await this.getUserActiveReservationsWithSpace(userId),
          start,
          end,
        )
      : new Set<SpaceTypeGroup>();

    return spaces.filter(
      (space) =>
        !occupiedIds.has(space.space_id) &&
        !blockedSpaceIds.has(space.space_id) &&
        !blockedZoneIds.has(space.zone_id) &&
        !reservedSpaceTypes.has(this.getSpaceTypeGroup(space)),
    );
  }

  async createSpecialEventReservations(
    createSpecialEventDto: CreateSpecialEventDto,
  ) {
    const startTime = new Date(createSpecialEventDto.start_time);
    const endTime = new Date(createSpecialEventDto.end_time);

    if (
      Number.isNaN(startTime.getTime()) ||
      Number.isNaN(endTime.getTime()) ||
      endTime <= startTime
    ) {
      throw new BadRequestException(
        'Invalid reservation window for special event',
      );
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

    const zoneSpace = await this.spaceRepository.findOne({
      where: {
        zone_id: createSpecialEventDto.zone_id,
      },
      relations: ['zone'],
    });

    const eventLocation =
      zoneSpace?.zone?.name ?? `Zona ${createSpecialEventDto.zone_id}`;
    const eventUserNeedId = Number(createSpecialEventDto.user_need_id);

    const savedEvent = await this.eventRepository.save(
      this.eventRepository.create({
        title: createSpecialEventDto.title,
        description: 'Evento especial creado desde el panel administrativo',
        location: eventLocation,
        start_time: startTime,
        end_time: endTime,
        expected_attendees: spaces.length,
        status: EventStatus.PLANNED,
        user_need_id: eventUserNeedId,
        created_by: createSpecialEventDto.user_id,
      }),
    );

    const conflictingReservations = await this.reservationRepository
      .createQueryBuilder('reservation')
      .innerJoinAndSelect('reservation.space', 'space')
      .where('space.zone_id = :zoneId', {
        zoneId: createSpecialEventDto.zone_id,
      })
      .andWhere('reservation.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: [
          ReservationStatus.CANCELLED,
          ReservationStatus.NO_SHOW,
        ],
      })
      .andWhere('reservation.start_time < :endTime', {
        endTime,
      })
      .andWhere(
        `COALESCE(
          CASE
            WHEN reservation.status = :checkedOutStatus THEN reservation.check_out_time
          END,
          reservation.end_time
        ) > :startTime`,
        {
          startTime,
          checkedOutStatus: ReservationStatus.CHECKED_OUT,
        },
      )
      .getMany();

    if (conflictingReservations.length > 0) {
      await this.reservationRepository.save(
        conflictingReservations.map((reservation) => ({
          ...reservation,
          status: ReservationStatus.CANCELLED,
        })),
      );

      for (const reservation of conflictingReservations) {
        await this.sendReservationNotification({
          userId: reservation.user_id,
          reason: NotificationReason.RESERVATION_CANCELLED,
          title: 'Reservación cancelada por evento especial',
          content: `${this.buildReservationSummary(reservation)} Tu reservación fue cancelada porque se creó un evento especial en la zona.`,
        });
      }
    }

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
        event_id: savedEvent.event_id,
        status: ReservationStatus.RESERVED,
      });

      const saved = await this.reservationRepository.save(reservation);
      createdReservations.push(saved);
    }

    await this.sendReservationNotification({
      userId: createSpecialEventDto.user_id,
      reason: NotificationReason.RESERVATION_SUCCESS,
      title: 'Reservación para evento creada',
      content: `Se crearon ${createdReservations.length} reservaciones para el evento especial "${createSpecialEventDto.title}".`,
    });

    return {
      event: {
        event_id: savedEvent.event_id,
        title: savedEvent.title,
      },
      title: createSpecialEventDto.title,
      zone_id: createSpecialEventDto.zone_id,
      createdReservations: createdReservations.length,
      cancelledReservations: conflictingReservations.length,
      blockedSpaces: spaces.length,
    };
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

  async checkInEvent(
    reservationId: number,
    userId: number,
    options?: { latitude?: number; longitude?: number; isAdmin?: boolean },
  ) {
    if (!options?.isAdmin) {
      throw new ForbiddenException('Only admins can check in an event');
    }

    const reservation = await this.findOne(reservationId);

    if (!reservation.event_id) {
      throw new BadRequestException(
        'This reservation is not linked to an event',
      );
    }

    const eventReservations = await this.reservationRepository.find({
      where: {
        event_id: reservation.event_id,
        status: ReservationStatus.RESERVED,
      },
    });

    const checkedInAt = new Date();

    for (const eventReservation of eventReservations) {
      eventReservation.status = ReservationStatus.CHECKED_IN;
      eventReservation.check_in_time = checkedInAt;
      eventReservation.latitude_check_in = options?.latitude ?? null;
      eventReservation.longitude_check_in = options?.longitude ?? null;
    }

    if (eventReservations.length > 0) {
      await this.reservationRepository.save(eventReservations);
    }

    return {
      event_id: reservation.event_id,
      checked_in_count: eventReservations.length,
      reservations: eventReservations,
    };
  }

  async checkOut(
    reservationId: number,
    userId: number,
    options?: { isAdmin?: boolean },
  ) {
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

    if (
      Number.isNaN(parsedEnd.getTime()) ||
      parsedEnd <= new Date(reservation.start_time) ||
      parsedEnd <= new Date()
    ) {
      throw new BadRequestException('Invalid new end time');
    }

    await this.assertSpaceIsAvailable(
      reservation.space_id,
      new Date(reservation.start_time),
      parsedEnd,
      reservation.reservation_id,
    );

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
    reservation.incident_notes =
      reportIncidentDto.notes ?? reportIncidentDto.description;

    // For reassignment and other incidents the user is leaving the space,
    // so mark it as freed now so others can book it
    const freesSpace =
      reportIncidentDto.type === IncidentType.REASSIGNMENT ||
      reportIncidentDto.type === IncidentType.OTHER;
    if (freesSpace) {
      reservation.check_out_time = new Date();
    }

    const updatedReservation =
      await this.reservationRepository.save(reservation);

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
    const previousStatus = existingReservation.status;

    // Validate availability when the time range changes
    if (updateReservationDto.start_time || updateReservationDto.end_time) {
      const newStart = updateReservationDto.start_time
        ? new Date(updateReservationDto.start_time)
        : existingReservation.start_time;
      const newEnd = updateReservationDto.end_time
        ? new Date(updateReservationDto.end_time)
        : existingReservation.end_time;

      if (Number.isNaN(newStart.getTime()) || Number.isNaN(newEnd.getTime())) {
        throw new BadRequestException('Formato de fecha inválido.');
      }
      if (newEnd <= newStart) {
        throw new BadRequestException(
          'La hora de fin debe ser posterior a la hora de inicio.',
        );
      }
      if (newEnd <= new Date()) {
        throw new BadRequestException(
          'No puedes reservar un horario que ya terminó.',
        );
      }

      // Check availability ignoring the current reservation (it frees its own slot)
      await this.assertSpaceIsAvailable(
        existingReservation.space_id,
        newStart,
        newEnd,
        existingReservation.reservation_id,
      );
    }

    this.reservationRepository.merge(existingReservation, updateReservationDto);

    const savedReservation =
      await this.reservationRepository.save(existingReservation);

    if (
      updateReservationDto.status &&
      updateReservationDto.status !== previousStatus
    ) {
      if (updateReservationDto.status === ReservationStatus.CANCELLED) {
        await this.sendReservationNotification({
          userId: savedReservation.user_id,
          reason: NotificationReason.RESERVATION_CANCELLED,
          title: 'Reservación cancelada',
          content: `${
            savedReservation.event_id
              ? 'Tu reservación asociada a un evento fue cancelada.'
              : 'Tu reservación fue cancelada correctamente.'
          } ${this.buildReservationSummary(savedReservation)}`,
        });
      }

      if (updateReservationDto.status === ReservationStatus.CHECKOUT_PENDING) {
        await this.sendReservationNotification({
          userId: savedReservation.user_id,
          reason: NotificationReason.CHECKOUT_PENDING,
          title: 'Checkout pendiente',
          content: `Tu reservación quedó en checkout pendiente. ${this.buildReservationSummary(savedReservation)}`,
        });
      }

      if (updateReservationDto.status === ReservationStatus.NO_SHOW) {
        await this.sendReservationNotification({
          userId: savedReservation.user_id,
          reason: NotificationReason.NO_SHOW,
          title: 'Reservación marcada como no-show',
          content: `Tu reservación fue marcada como no-show. ${this.buildReservationSummary(savedReservation)}`,
        });
      }
    }

    return savedReservation;
  }

  async remove(id: number) {
    const existingReservation = await this.findOne(id);
    await this.reservationRepository.softRemove(existingReservation);

    return existingReservation;
  }
}

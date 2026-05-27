import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBlockDto } from './dto/create-block.dto';
import { CreateSpaceBlocksDto } from './dto/create-space-blocks.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Block } from './entities/block.entity';
import { Space } from '../space/entities/space.entity';
import { Zone } from '../zone/entities/zone.entity';
import { Reservation } from '../reservation/entities/reservation.entity';
import { CreateEmergencyZoneBlockDto } from './dto/create-emergency-zone-block.dto';
import { ReservationStatus } from '../reservation/entities/reservation.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationReason } from '../notifications/entities/notification.entity';

@Injectable()
export class BlockService {
  constructor(
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
    @InjectRepository(Space)
    private readonly spaceRepository: Repository<Space>,
    @InjectRepository(Zone)
    private readonly zoneRepository: Repository<Zone>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async notifyCancelledReservation(
    reservation: Reservation,
    content: string,
  ) {
    try {
      await this.notificationsService.create({
        user_id: reservation.user_id,
        reason: NotificationReason.RESERVATION_CANCELLED_BY_BLOCK,
        title: 'Reservación cancelada por bloqueo',
        content,
      });
    } catch (error) {
      console.error('[NOTIFICATION ERROR]', error);
    }
  }

  create(createBlockDto: CreateBlockDto) {
    const newBlock = this.blockRepository.create(createBlockDto);
    return this.blockRepository.save(newBlock);
  }

  async createSpaceBlocks(createSpaceBlocksDto: CreateSpaceBlocksDto) {
    const spaceIds = [
      ...new Set(
        createSpaceBlocksDto.space_ids.map((spaceId) => Number(spaceId)),
      ),
    ].filter((spaceId) => Number.isFinite(spaceId) && spaceId > 0);

    if (spaceIds.length === 0) {
      throw new BadRequestException('Select at least one space to block');
    }

    const spaces = await this.spaceRepository.find({
      where: { space_id: In(spaceIds) },
      relations: ['zone'],
    });

    if (spaces.length !== spaceIds.length) {
      throw new BadRequestException('One or more spaces were not found');
    }

    const startTime = new Date(createSpaceBlocksDto.start_time);
    const endTime = createSpaceBlocksDto.end_time
      ? new Date(createSpaceBlocksDto.end_time)
      : null;

    if (Number.isNaN(startTime.getTime())) {
      throw new BadRequestException('Invalid start time');
    }

    if (endTime && Number.isNaN(endTime.getTime())) {
      throw new BadRequestException('Invalid end time');
    }

    if (endTime && endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    const blocks = spaces.map((space) =>
      this.blockRepository.create({
        reason: createSpaceBlocksDto.reason,
        start_time: startTime,
        end_time: endTime,
        space_id: space.space_id,
        zone_id: null,
      }),
    );

    const conflictingReservationsQuery = this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.space_id IN (:...spaceIds)', { spaceIds })
      .andWhere('reservation.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: [
          ReservationStatus.CANCELLED,
          ReservationStatus.NO_SHOW,
        ],
      })
      .andWhere('reservation.start_time < :endTime', {
        endTime: endTime ?? new Date('2999-12-31T23:59:59.999Z'),
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
      );

    const conflictingReservations =
      await conflictingReservationsQuery.getMany();

    if (conflictingReservations.length > 0) {
      await this.reservationRepository.save(
        conflictingReservations.map((reservation) => ({
          ...reservation,
          status: ReservationStatus.CANCELLED,
        })),
      );

      for (const reservation of conflictingReservations) {
        await this.notifyCancelledReservation(
          reservation,
          'Tu reservación fue cancelada porque un bloqueo del administrador afecta el espacio seleccionado.',
        );
      }
    }

    const savedBlocks = await this.blockRepository.save(blocks);

    return {
      blocks: savedBlocks,
      cancelledReservations: conflictingReservations.length,
    };
  }

  findAll() {
    return this.blockRepository.find({
      relations: ['space', 'zone'],
    });
  }

  async findOne(block_id: number) {
    const block = await this.blockRepository.findOne({
      where: { block_id },
      relations: ['space', 'zone'],
    });

    if (!block) {
      throw new NotFoundException();
    }

    return block;
  }

  async update(id: number, updateBlockDto: UpdateBlockDto) {
    const existingBlock = await this.findOne(id);

    this.blockRepository.merge(existingBlock, updateBlockDto);

    return this.blockRepository.save(existingBlock);
  }

  async createEmergencyZoneBlock(
    createEmergencyZoneBlockDto: CreateEmergencyZoneBlockDto,
  ) {
    const zone = await this.zoneRepository.findOne({
      where: { zone_id: createEmergencyZoneBlockDto.zone_id },
      relations: ['spaces'],
    });

    if (!zone) {
      throw new BadRequestException('Zone not found');
    }

    const startTime = new Date(createEmergencyZoneBlockDto.start_time);
    const endTime = createEmergencyZoneBlockDto.end_time
      ? new Date(createEmergencyZoneBlockDto.end_time)
      : null;

    if (Number.isNaN(startTime.getTime())) {
      throw new BadRequestException('Invalid start time');
    }

    if (endTime && Number.isNaN(endTime.getTime())) {
      throw new BadRequestException('Invalid end time');
    }

    if (endTime && endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    const newBlock = this.blockRepository.create({
      reason: createEmergencyZoneBlockDto.reason,
      start_time: startTime,
      end_time: endTime,
      zone_id: zone.zone_id,
      space_id: null,
    });

    const conflictingReservationsQuery = this.reservationRepository
      .createQueryBuilder('reservation')
      .innerJoin('reservation.space', 'space')
      .where('space.zone_id = :zoneId', { zoneId: zone.zone_id })
      .andWhere('reservation.status != :cancelled', {
        cancelled: ReservationStatus.CANCELLED,
      })
      .andWhere('reservation.end_time > :startTime', { startTime });

    if (endTime) {
      conflictingReservationsQuery.andWhere(
        'reservation.start_time < :endTime',
        {
          endTime,
        },
      );
    }

    const conflictingReservations =
      await conflictingReservationsQuery.getMany();

    if (conflictingReservations.length > 0) {
      await this.reservationRepository.save(
        conflictingReservations.map((reservation) => ({
          ...reservation,
          status: ReservationStatus.CANCELLED,
        })),
      );

      for (const reservation of conflictingReservations) {
        await this.notifyCancelledReservation(
          reservation,
          'Tu reservación fue cancelada porque un bloqueo del administrador afecta la zona seleccionada.',
        );
      }
    }

    const savedBlock = await this.blockRepository.save(newBlock);

    return {
      block: savedBlock,
      cancelledReservations: conflictingReservations.length,
    };
  }

  async remove(id: number) {
    const existingBlock = await this.findOne(id);
    await this.blockRepository.softRemove(existingBlock);

    return existingBlock;
  }
}

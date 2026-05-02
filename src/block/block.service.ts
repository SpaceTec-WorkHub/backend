import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Block } from './entities/block.entity';
import { Space } from '../space/entities/space.entity';
import { Zone } from '../zone/entities/zone.entity';
import { Reservation } from '../reservation/entities/reservation.entity';
import { CreateEmergencyZoneBlockDto } from './dto/create-emergency-zone-block.dto';
import { ReservationStatus } from '../reservation/entities/reservation.entity';

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
  ) {}

  create(createBlockDto: CreateBlockDto) {
    const newBlock = this.blockRepository.create(createBlockDto);
    return this.blockRepository.save(newBlock);
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

  async createEmergencyZoneBlock(createEmergencyZoneBlockDto: CreateEmergencyZoneBlockDto) {
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
      .andWhere('reservation.status != :cancelled', { cancelled: ReservationStatus.CANCELLED })
      .andWhere('reservation.end_time > :startTime', { startTime });

    if (endTime) {
      conflictingReservationsQuery.andWhere('reservation.start_time < :endTime', {
        endTime,
      });
    }

    const conflictingReservations = await conflictingReservationsQuery.getMany();

    if (conflictingReservations.length > 0) {
      await this.reservationRepository.save(
        conflictingReservations.map((reservation) => ({
          ...reservation,
          status: ReservationStatus.CANCELLED,
        })),
      );
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

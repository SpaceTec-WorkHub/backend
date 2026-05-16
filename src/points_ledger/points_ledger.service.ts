import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PointsLedger } from './entities/points_ledger.entity';
import { CreatePointsLedgerDto } from './dto/create-points_ledger.dto';
import { UpdatePointsLedgerDto } from './dto/update-points_ledger.dto';

@Injectable()
export class PointsLedgerService {
  constructor(
    @InjectRepository(PointsLedger)
    private readonly pointsLedgerRepository: Repository<PointsLedger>,
  ) {}

  async create(createPointsLedgerDto: CreatePointsLedgerDto) {
    const newPointsLedger = this.pointsLedgerRepository.create(
      createPointsLedgerDto,
    );
    return this.pointsLedgerRepository.save(newPointsLedger);
  }

  async findAll() {
    return this.pointsLedgerRepository.find({
      relations: ['user'],
    });
  }

  async findOne(id: number) {
    const pointsLedger = await this.pointsLedgerRepository.findOne({
      where: { points_id: id },
      relations: ['user'],
    });
    if (!pointsLedger) {
      throw new NotFoundException('PointsLedger not found');
    }
    return pointsLedger;
  }

  async update(id: number, updatePointsLedgerDto: UpdatePointsLedgerDto) {
    const pointsLedger = await this.findOne(id);
    Object.assign(pointsLedger, updatePointsLedgerDto);
    return this.pointsLedgerRepository.save(pointsLedger);
  }

  async remove(id: number) {
    const pointsLedger = await this.findOne(id);
    return this.pointsLedgerRepository.softRemove(pointsLedger);
  }
}

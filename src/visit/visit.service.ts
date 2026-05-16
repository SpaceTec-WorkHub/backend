import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Visit } from './entities/visit.entity';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';

@Injectable()
export class VisitService {
  constructor(
    @InjectRepository(Visit)
    private readonly visitRepository: Repository<Visit>,
  ) {}

  async create(createVisitDto: CreateVisitDto) {
    const newVisit = this.visitRepository.create(createVisitDto);
    return this.visitRepository.save(newVisit);
  }

  async findAll() {
    return this.visitRepository.find({
      relations: ['priorityLevel', 'user'],
    });
  }

  async findOne(id: number) {
    const visit = await this.visitRepository.findOne({
      where: { visit_id: id },
      relations: ['priorityLevel', 'user'],
    });
    if (!visit) {
      throw new NotFoundException('Visit not found');
    }
    return visit;
  }

  async update(id: number, updateVisitDto: UpdateVisitDto) {
    const visit = await this.findOne(id);
    Object.assign(visit, updateVisitDto);
    return this.visitRepository.save(visit);
  }

  async remove(id: number) {
    const visit = await this.findOne(id);
    return this.visitRepository.softRemove(visit);
  }
}

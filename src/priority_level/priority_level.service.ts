import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriorityLevel } from './entities/priority_level.entity';
import { CreatePriorityLevelDto } from './dto/create-priority_level.dto';
import { UpdatePriorityLevelDto } from './dto/update-priority_level.dto';

@Injectable()
export class PriorityLevelService {
  constructor(
    @InjectRepository(PriorityLevel)
    private readonly priorityLevelRepository: Repository<PriorityLevel>,
  ) {}

  async create(createPriorityLevelDto: CreatePriorityLevelDto) {
    const newPriorityLevel = this.priorityLevelRepository.create(createPriorityLevelDto);
    return this.priorityLevelRepository.save(newPriorityLevel);
  }

  async findAll() {
    return this.priorityLevelRepository.find();
  }

  async findOne(id: number) {
    const priorityLevel = await this.priorityLevelRepository.findOne({
      where: { priority_level_id: id },
    });
    if (!priorityLevel) {
      throw new NotFoundException('PriorityLevel not found');
    }
    return priorityLevel;
  }

  async update(id: number, updatePriorityLevelDto: UpdatePriorityLevelDto) {
    const priorityLevel = await this.findOne(id);
    Object.assign(priorityLevel, updatePriorityLevelDto);
    return this.priorityLevelRepository.save(priorityLevel);
  }

  async remove(id: number) {
    const priorityLevel = await this.findOne(id);
    return this.priorityLevelRepository.softRemove(priorityLevel);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckEvent } from './entities/check_event.entity';
import { CreateCheckEventDto } from './dto/create-check_event.dto';
import { UpdateCheckEventDto } from './dto/update-check_event.dto';

@Injectable()
export class CheckEventService {
  constructor(
    @InjectRepository(CheckEvent)
    private readonly checkEventRepository: Repository<CheckEvent>,
  ) {}

  async create(createCheckEventDto: CreateCheckEventDto) {
    const newCheckEvent = this.checkEventRepository.create(createCheckEventDto);
    return this.checkEventRepository.save(newCheckEvent);
  }

  async findAll() {
    return this.checkEventRepository.find({
      relations: ['reservation'],
    });
  }

  async findOne(id: number) {
    const checkEvent = await this.checkEventRepository.findOne({
      where: { check_event_id: id },
      relations: ['reservation'],
    });
    if (!checkEvent) {
      throw new NotFoundException('CheckEvent not found');
    }
    return checkEvent;
  }

  async update(id: number, updateCheckEventDto: UpdateCheckEventDto) {
    const checkEvent = await this.findOne(id);
    Object.assign(checkEvent, updateCheckEventDto);
    return this.checkEventRepository.save(checkEvent);
  }

  async remove(id: number) {
    const checkEvent = await this.findOne(id);
    return this.checkEventRepository.softRemove(checkEvent);
  }
}

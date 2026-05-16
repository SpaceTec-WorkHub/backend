import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async create(createEventDto: CreateEventDto) {
    const newEvent = this.eventRepository.create(createEventDto);
    return this.eventRepository.save(newEvent);
  }

  async findAll() {
    return this.eventRepository.find({
      relations: ['userNeed', 'creator', 'reservations'],
    });
  }

  async findOne(id: number) {
    const event = await this.eventRepository.findOne({
      where: { event_id: id },
      relations: ['userNeed', 'creator', 'reservations'],
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  async update(id: number, updateEventDto: UpdateEventDto) {
    const event = await this.findOne(id);
    Object.assign(event, updateEventDto);
    return this.eventRepository.save(event);
  }

  async remove(id: number) {
    const event = await this.findOne(id);
    return this.eventRepository.softRemove(event);
  }
}

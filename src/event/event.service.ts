import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Reservation, ReservationStatus } from '../reservation/entities/reservation.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationReason } from '../notifications/entities/notification.entity';
import { EventStatus } from './entities/event.entity';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async notifyReservationCancelled(reservation: Reservation, eventTitle: string) {
    try {
      await this.notificationsService.create({
        user_id: reservation.user_id,
        reason: NotificationReason.RESERVATION_CANCELLED,
        title: 'Evento cancelado',
        content: `Tu reservación para el evento "${eventTitle}" fue cancelada porque el evento se canceló.`,
      });
    } catch (error) {
      console.error('[NOTIFICATION ERROR]', error);
    }
  }

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

  async cancel(id: number) {
    const event = await this.findOne(id);

    const reservations = await this.reservationRepository.find({
      where: { event_id: id },
      relations: ['user', 'space'],
    });

    const reservationsToCancel = reservations.filter(
      (reservation) => reservation.status !== ReservationStatus.CANCELLED,
    );

    for (const reservation of reservationsToCancel) {
      reservation.status = ReservationStatus.CANCELLED;
    }

    if (reservationsToCancel.length > 0) {
      await this.reservationRepository.save(reservationsToCancel);

      for (const reservation of reservationsToCancel) {
        await this.notifyReservationCancelled(reservation, event.title);
      }
    }

    event.status = EventStatus.CANCELLED;

    const savedEvent = await this.eventRepository.save(event);

    return {
      event: savedEvent,
      cancelledReservations: reservationsToCancel.length,
    };
  }

  async remove(id: number) {
    const event = await this.findOne(id);
    return this.eventRepository.softRemove(event);
  }
}

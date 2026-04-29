import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from './entities/reservation.entity';

@Injectable()
export class ReservationService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
  ) {}

  create(createReservationDto: CreateReservationDto) {
    const newReservation = this.reservationRepository.create(
      createReservationDto,
    );

    return this.reservationRepository.save(newReservation);
  }

  findAll() {
    return this.reservationRepository.find({
      relations: ['user', 'space', 'release', 'event', 'checkEvents'],
    });
  }

  async findOne(reservation_id: number) {
    const reservation = await this.reservationRepository.findOne({
      where: { reservation_id },
      relations: ['user', 'space', 'release', 'event', 'checkEvents'],
    });

    if (!reservation) {
      throw new NotFoundException();
    }

    return reservation;
  }

  async update(id: number, updateReservationDto: UpdateReservationDto) {
    const existingReservation = await this.findOne(id);

    this.reservationRepository.merge(existingReservation, updateReservationDto);

    return this.reservationRepository.save(existingReservation);
  }

  async remove(id: number) {
    const existingReservation = await this.findOne(id);
    await this.reservationRepository.softRemove(existingReservation);

    return existingReservation;
  }
}

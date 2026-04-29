import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { Reservation } from '../../reservation/entities/reservation.entity';

@Entity()
export class CheckEvent extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  check_event_id!: number;

  @Column({ type: 'varchar' })
  event_type!: string;

  @Column({ type: 'varchar' })
  method!: string;

  @Column({ type: 'timestamp' })
  event_time!: Date;

  @Column({ type: 'integer' })
  reservation_id!: number;

  @ManyToOne(() => Reservation, (reservation) => reservation.checkEvents)
  @JoinColumn({ name: 'reservation_id' })
  reservation!: Reservation;
}

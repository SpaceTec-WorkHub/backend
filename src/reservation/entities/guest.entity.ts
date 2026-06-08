import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { Reservation } from './reservation.entity';

@Entity()
export class Guest extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  guest_id!: number;

  @Column({ type: 'integer' })
  reservation_id!: number;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  email?: string | null;

  @ManyToOne(() => Reservation, (reservation) => reservation.guests)
  @JoinColumn({ name: 'reservation_id' })
  reservation!: Reservation;
}

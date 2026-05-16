import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { Reservation } from './reservation.entity';
import { Space } from '../../space/entities/space.entity';
import { User } from '../../user/entities/user.entity';

export enum IncidentType {
  OCCUPIED = 'occupied',
  REASSIGNMENT = 'reassignment',
  OTHER = 'other',
}

export enum IncidentStatus {
  OPEN = 'open',
  RESOLVED = 'resolved',
}

@Entity('incident')
export class Incident {
  @PrimaryGeneratedColumn({ type: 'integer' })
  incident_id!: number;

  @Column({ type: 'integer' })
  reservation_id!: number;

  @Column({ type: 'integer' })
  reported_by!: number;

  @Column({ type: 'integer' })
  space_id!: number;

  @Column({ type: 'integer', nullable: true })
  previous_reservation_id!: number | null;

  @Column({ type: 'varchar' })
  type!: IncidentType;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', default: IncidentStatus.OPEN })
  status!: IncidentStatus;

  @Column({ type: 'timestamp', default: () => 'now()' })
  created_at!: Date;

  @ManyToOne(() => Reservation, (reservation) => reservation.incidents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reservation_id' })
  reservation!: Reservation;

  @ManyToOne(() => Reservation, { nullable: true })
  @JoinColumn({ name: 'previous_reservation_id' })
  previous_reservation?: Reservation | null;

  @ManyToOne(() => Space, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'space_id' })
  space!: Space;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reported_by' })
  reporter!: User;
}
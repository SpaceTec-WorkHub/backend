import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { User } from '../../user/entities/user.entity';
import { Space } from '../../space/entities/space.entity';
import { Release } from '../../release/entities/release.entity';
import { Incident } from './incident.entity';

export enum ReservationStatus {
  RESERVED = 'reserved',
  CHECKED_IN = 'checked_in',
  CHECKED_OUT = 'checked_out',
  NO_SHOW = 'no_show',
  CANCELLED = 'cancelled',
  CHECKOUT_PENDING = 'checkout_pending',
  INCIDENT = 'incident',
}

@Entity()
export class Reservation extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  reservation_id!: number;

  @Column({ type: 'timestamp' })
  start_time!: Date;

  @Column({ type: 'timestamp' })
  end_time!: Date;

  @Column({
    type: 'varchar',
    enum: ReservationStatus,
    default: ReservationStatus.RESERVED,
  })
  status!: ReservationStatus;

  @Column({ type: 'timestamp', nullable: true })
  check_in_time!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  check_out_time!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  no_show_at!: Date | null;

  @Column({ type: 'text', nullable: true })
  incident_notes!: string | null;

  @Column({ type: 'integer', nullable: true })
  reassigned_space_id!: number | null;

  @Column({ type: 'double precision', nullable: true })
  latitude_check_in!: number | null;

  @Column({ type: 'double precision', nullable: true })
  longitude_check_in!: number | null;

  @Column({ type: 'integer' })
  user_id!: number;

  @Column({ type: 'integer' })
  space_id!: number;

  @ManyToOne(() => User, (user) => user.reservations)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Space, (space) => space.reservations)
  @JoinColumn({ name: 'space_id' })
  space!: Space;

  @ManyToOne(() => Space, { nullable: true })
  @JoinColumn({ name: 'reassigned_space_id' })
  reassigned_space?: Space | null;

  @OneToOne(() => Release, (release) => release.reservation)
  release?: Release;

  @OneToMany(() => Incident, (incident) => incident.reservation)
  incidents!: Incident[];
}

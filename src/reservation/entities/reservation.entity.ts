import {
  Entity,
  Column,
  ManyToOne,
  OneToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { User } from '../../user/entities/user.entity';
import { Space } from '../../space/entities/space.entity';
import { Release } from '../../release/entities/release.entity';
import { CheckEvent } from '../../check_event/entities/check_event.entity';
import { Event } from '../../event/entities/event.entity';

export enum ReservationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
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
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status!: ReservationStatus;

  @Column({ type: 'varchar', unique: true })
  code!: string;

  @Column({ type: 'integer' })
  user_id!: number;

  @Column({ type: 'integer' })
  space_id!: number;

  @Column({ type: 'integer', nullable: true })
  event_id?: number;

  @ManyToOne(() => User, (user) => user.reservations)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Space, (space) => space.reservations)
  @JoinColumn({ name: 'space_id' })
  space!: Space;

  @ManyToOne(() => Event, (event) => event.reservations, { nullable: true })
  @JoinColumn({ name: 'event_id' })
  event?: Event;

  @OneToOne(() => Release, (release) => release.reservation)
  release?: Release;

  @OneToMany(() => CheckEvent, (checkEvent) => checkEvent.reservation)
  checkEvents!: CheckEvent[];
}

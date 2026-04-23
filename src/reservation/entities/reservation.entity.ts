import {
  Entity,
  Column,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { User } from '../../user/entities/user.entity';
import { Space } from '../../space/entities/space.entity';
import { Release } from '../../release/entities/release.entity';

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

  @OneToOne(() => Release, (release) => release.reservation)
  release?: Release;
}

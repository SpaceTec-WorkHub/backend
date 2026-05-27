import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { User } from '../../user/entities/user.entity';

export enum NotificationReason {
  BLOCK = 'block',
  RESERVATION_SUCCESS = 'reservation_success',
  RESERVATION_CANCELLED = 'reservation_cancelled',
  RESERVATION_CANCELLED_BY_BLOCK = 'reservation_cancelled_by_block',
  CHECKOUT_PENDING = 'checkout_pending',
  RESERVATION_REMINDER = 'reservation_reminder',
  NO_SHOW = 'no_show',
  CARPOOL_TRIP_CONFIRMED = 'carpool_trip_confirmed',
  CARPOOL_MEMBER_ADDED = 'carpool_member_added',
  CARPOOL_MEMBER_REMOVED = 'carpool_member_removed',
  CARPOOL_TRIP_CANCELLED = 'carpool_trip_cancelled',
  CARPOOL_ALERT = 'carpool_alert',
  PASSWORD_RESET_REQUESTED = 'password_reset_requested',
  PASSWORD_RESET_COMPLETED = 'password_reset_completed',
  SYSTEM = 'system',
}

@Entity()
export class Notification extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  notification_id!: number;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({
    type: 'enum',
    enum: NotificationReason,
    default: NotificationReason.SYSTEM,
  })
  reason!: NotificationReason;

  @Column({ type: 'integer' })
  user_id!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}

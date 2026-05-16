import {
  Entity,
  Column,
  ManyToOne,
  PrimaryColumn,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { User } from '../../user/entities/user.entity';
import { CarpoolTrip } from './carpool_trip.entity';

export enum TripRiderStatus {
  REQUESTED = 'requested',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  BOARDED = 'boarded',
  NO_SHOW = 'no_show',
  COMPLETED = 'completed',
}

@Entity()
export class TripRider extends BaseEntity {
  @PrimaryColumn({ type: 'integer' })
  trip_id!: number;

  @PrimaryColumn({ type: 'integer' })
  user_id!: number;

  @Column({
    type: 'enum',
    enum: TripRiderStatus,
    default: TripRiderStatus.ACCEPTED,
  })
  status!: TripRiderStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  requested_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  responded_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  joined_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  left_at?: Date;

  @ManyToOne(() => CarpoolTrip, (trip) => trip.tripRiders)
  @JoinColumn({ name: 'trip_id' })
  trip!: CarpoolTrip;

  @ManyToOne(() => User, (user) => user.tripRiders)
  @JoinColumn({ name: 'user_id' })
  user!: User;
}

import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { UserNeed } from '../../user_need/entities/user_need.entity';
import { User } from '../../user/entities/user.entity';
import { Reservation } from '../../reservation/entities/reservation.entity';

export enum EventStatus {
  PLANNED = 'planned',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity()
export class Event extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  event_id!: number;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', nullable: true })
  location?: string;

  @Column({ type: 'timestamp' })
  start_time!: Date;

  @Column({ type: 'timestamp' })
  end_time!: Date;

  @Column({ type: 'integer', nullable: true })
  expected_attendees?: number;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.PLANNED,
  })
  status!: EventStatus;

  @Column({ type: 'integer' })
  user_need_id!: number;

  @Column({ type: 'integer' })
  created_by!: number;

  @ManyToOne(() => UserNeed, (userNeed) => userNeed.events)
  @JoinColumn({ name: 'user_need_id' })
  userNeed!: UserNeed;

  @ManyToOne(() => User, (user) => user.createdEvents)
  @JoinColumn({ name: 'created_by' })
  creator!: User;

  @OneToMany(() => Reservation, (reservation) => reservation.event, {
    nullable: true,
  })
  reservations!: Reservation[];
}

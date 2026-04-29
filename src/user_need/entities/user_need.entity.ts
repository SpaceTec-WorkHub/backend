import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { User } from '../../user/entities/user.entity';
import { PriorityLevel } from '../../priority_level/entities/priority_level.entity';
import { Event } from '../../event/entities/event.entity';

export enum UserNeedStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
}

@Entity()
export class UserNeed extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  user_need_id!: number;

  @Column({ type: 'varchar' })
  need_type!: string;

  @Column({ type: 'timestamp' })
  start_date!: Date;

  @Column({ type: 'timestamp' })
  end_date!: Date;

  @Column({
    type: 'enum',
    enum: UserNeedStatus,
    default: UserNeedStatus.ACTIVE,
  })
  status!: UserNeedStatus;

  @Column({ type: 'varchar' })
  reason!: string;

  @Column({ type: 'integer' })
  user_id!: number;

  @Column({ type: 'integer' })
  priority_level_id!: number;

  @ManyToOne(() => User, (user) => user.userNeeds)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => PriorityLevel)
  @JoinColumn({ name: 'priority_level_id' })
  priorityLevel!: PriorityLevel;

  @OneToMany(() => Event, (event) => event.userNeed)
  events!: Event[];
}

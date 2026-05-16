import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { PriorityLevel } from '../../priority_level/entities/priority_level.entity';
import { User } from '../../user/entities/user.entity';

export enum VisitStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity()
export class Visit extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  visit_id!: number;

  @Column({ type: 'varchar' })
  visitor_name!: string;

  @Column({ type: 'varchar' })
  company!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  visit_date!: Date;

  @Column({
    type: 'enum',
    enum: VisitStatus,
    default: VisitStatus.PENDING,
  })
  status!: VisitStatus;

  @Column({ type: 'integer' })
  priority_level_id!: number;

  @Column({ type: 'integer' })
  user_id!: number;

  @ManyToOne(() => PriorityLevel)
  @JoinColumn({ name: 'priority_level_id' })
  priorityLevel!: PriorityLevel;

  @ManyToOne(() => User, (user) => user.visits)
  @JoinColumn({ name: 'user_id' })
  user!: User;
}

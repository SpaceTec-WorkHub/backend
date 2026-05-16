import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { UserBadge } from './user_badge.entity';

@Entity()
export class Badge extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  badge_id!: number;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar' })
  type!: string;

  @Column({ type: 'varchar' })
  icon!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar' })
  criteria!: string;

  @Column({ type: 'integer', nullable: true })
  points_reward?: number;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'integer', default: 0 })
  unlock_count!: number;

  @OneToMany(() => UserBadge, (userBadge) => userBadge.badge)
  users!: UserBadge[];
}

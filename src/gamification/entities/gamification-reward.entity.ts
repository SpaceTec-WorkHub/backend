import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';

@Entity()
export class GamificationReward extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  gamification_reward_id!: number;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'varchar' })
  description!: string;

  @Column({ type: 'integer', default: 0 })
  points!: number;

  @Column({ type: 'timestamp', nullable: true })
  period_start?: Date;

  @Column({ type: 'timestamp', nullable: true })
  period_end?: Date;
}
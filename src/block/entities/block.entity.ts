import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { Space } from '../../space/entities/space.entity';

@Entity()
export class Block extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  block_id!: number;

  @Column({ type: 'varchar' })
  reason!: string;

  @Column({ type: 'timestamp' })
  start_time!: Date;

  @Column({ type: 'timestamp' })
  end_time!: Date;

  @Column({ type: 'integer' })
  space_id!: number;

  @ManyToOne(() => Space)
  @JoinColumn({ name: 'space_id' })
  space!: Space;
}

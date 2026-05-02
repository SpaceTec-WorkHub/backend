import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { Space } from '../../space/entities/space.entity';
import { Zone } from '../../zone/entities/zone.entity';

@Entity()
export class Block extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  block_id!: number;

  @Column({ type: 'varchar' })
  reason!: string;

  @Column({ type: 'timestamp' })
  start_time!: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_time!: Date | null;

  @Column({ type: 'integer', nullable: true })
  space_id!: number | null;

  @Column({ type: 'integer', nullable: true })
  zone_id!: number | null;

  @ManyToOne(() => Space, { nullable: true })
  @JoinColumn({ name: 'space_id' })
  space?: Space | null;

  @ManyToOne(() => Zone, { nullable: true })
  @JoinColumn({ name: 'zone_id' })
  zone?: Zone | null;
}

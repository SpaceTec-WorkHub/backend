import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { User } from '../../user/entities/user.entity';

export enum OperationType {
  ADD = 'add',
  SUBTRACT = 'subtract',
}

@Entity()
export class PointsLedger extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  points_id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({ type: 'varchar' })
  reason!: string;

  @Column({ type: 'integer' })
  points_delta!: number;

  @Column({
    type: 'enum',
    enum: OperationType,
    default: OperationType.ADD,
  })
  operation_type!: OperationType;

  @Column({ type: 'integer' })
  balance!: number;

  @Column({ type: 'varchar' })
  reference_type!: string;

  @Column({ type: 'varchar', nullable: true })
  reference_id?: string;

  @Column({ type: 'integer' })
  user_id!: number;

  @ManyToOne(() => User, (user) => user.pointsLedger)
  @JoinColumn({ name: 'user_id' })
  user!: User;
}

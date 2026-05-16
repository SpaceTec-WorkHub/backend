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
import { CarpoolTrip } from '../../carpool_trip/entities/carpool_trip.entity';

@Entity()
export class Vehicle extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  vehicle_id!: number;

  @Column({ type: 'varchar', unique: true })
  plate_number!: string;

  @Column({ type: 'varchar' })
  brand!: string;

  @Column({ type: 'varchar' })
  model!: string;

  @Column({ type: 'varchar', nullable: true })
  color?: string;

  @Column({ type: 'integer', nullable: true })
  year?: number;

  @Column({ type: 'integer' })
  seats_total!: number;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'integer' })
  owner_id!: number;

  @ManyToOne(() => User, (user) => user.vehicles)
  @JoinColumn({ name: 'owner_id' })
  owner!: User;

  @OneToMany(() => CarpoolTrip, (carpoolTrip) => carpoolTrip.vehicle)
  trips!: CarpoolTrip[];
}

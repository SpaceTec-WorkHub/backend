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
import { Vehicle } from '../../vehicle/entities/vehicle.entity';
import { TripRider } from './trip_rider.entity';

export enum CarpoolTripStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  FULL = 'full',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity()
export class CarpoolTrip extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  trip_id!: number;

  @Column({ type: 'timestamp' })
  trip_date!: Date;

  @Column({
    type: 'enum',
    enum: CarpoolTripStatus,
    default: CarpoolTripStatus.OPEN,
  })
  status!: CarpoolTripStatus;

  @Column({ type: 'integer' })
  seats_available!: number;

  @Column({ type: 'integer' })
  seats_total!: number;

  @Column({ type: 'varchar' })
  origin!: string;

  @Column({ type: 'varchar' })
  destination!: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'integer' })
  driver_id!: number;

  @Column({ type: 'integer' })
  vehicle_id!: number;

  @ManyToOne(() => User, (user) => user.driverTrips)
  @JoinColumn({ name: 'driver_id' })
  driver!: User;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.trips)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: Vehicle;

  @OneToMany(() => TripRider, (tripRider) => tripRider.trip)
  tripRiders!: TripRider[];
}

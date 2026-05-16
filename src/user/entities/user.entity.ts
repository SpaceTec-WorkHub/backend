import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { Role } from '../../role/entities/role.entity';
import { SpaceUserUsage } from '../../space_user_usage/entities/space_user_usage.entity';
import { Reservation } from '../../reservation/entities/reservation.entity';
import { Visit } from '../../visit/entities/visit.entity';
import { UserNeed } from '../../user_need/entities/user_need.entity';
import { Event } from '../../event/entities/event.entity';
import { PointsLedger } from '../../points_ledger/entities/points_ledger.entity';
import { UserBadge } from '../../badge/entities/user_badge.entity';
import { CarpoolTrip } from '../../carpool_trip/entities/carpool_trip.entity';
import { TripRider } from '../../carpool_trip/entities/trip_rider.entity';
import { Vehicle } from '../../vehicle/entities/vehicle.entity';

export enum UserType {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  user_id!: number;

  @Column({ type: 'varchar', nullable: true, unique: true })
  email?: string;

  @Column({ type: 'varchar', nullable: true })
  password!: string;

  @Column({ type: 'varchar', nullable: true })
  full_name!: string;

  @Column({ type: 'enum', enum: UserType })
  user_type!: UserType;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status!: UserStatus;

  @ManyToOne(() => Role, (role) => role.users, { nullable: true })
  @JoinColumn({ name: 'role_id' })
  role?: Role;

  @OneToMany(() => SpaceUserUsage, (spaceUserUsage) => spaceUserUsage.user)
  space_user_usages!: SpaceUserUsage[];

  @OneToMany(() => Reservation, (reservation) => reservation.user)
  reservations!: Reservation[];

  @OneToMany(() => Visit, (visit) => visit.user)
  visits!: Visit[];

  @OneToMany(() => UserNeed, (userNeed) => userNeed.user)
  userNeeds!: UserNeed[];

  @OneToMany(() => Event, (event) => event.creator)
  createdEvents!: Event[];

  @OneToMany(() => PointsLedger, (pointsLedger) => pointsLedger.user)
  pointsLedger!: PointsLedger[];

  @OneToMany(() => UserBadge, (userBadge) => userBadge.user)
  badges!: UserBadge[];

  @OneToMany(() => CarpoolTrip, (carpoolTrip) => carpoolTrip.driver)
  driverTrips!: CarpoolTrip[];

  @OneToMany(() => TripRider, (tripRider) => tripRider.user)
  tripRiders!: TripRider[];

  @OneToMany(() => Vehicle, (vehicle) => vehicle.owner)
  vehicles!: Vehicle[];
}

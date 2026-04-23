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
}

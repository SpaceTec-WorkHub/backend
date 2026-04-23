import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { SpaceType } from '../../space_type/entities/space_type.entity';
import { Zone } from '../../zone/entities/zone.entity';
import { SpaceUserUsage } from '../../space_user_usage/entities/space_user_usage.entity';
import { Reservation } from '../../reservation/entities/reservation.entity';

export enum SpaceStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
  BLOCKED = 'blocked',
}

@Entity()
export class Space extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  space_id!: number;

  @Column({ type: 'varchar', unique: true })
  code!: string;

  @Column({ type: 'boolean', default: false })
  is_accessible!: boolean;

  @Column({ type: 'boolean', default: false })
  is_priority!: boolean;

  @Column({ type: 'enum', enum: SpaceStatus, default: SpaceStatus.AVAILABLE })
  status!: SpaceStatus;

  @ManyToOne(() => SpaceType, (spaceType) => spaceType.spaces)
  @JoinColumn({ name: 'space_type_id' })
  space_type!: SpaceType;

  @Column({ type: 'integer' })
  zone_id!: number;

  @ManyToOne(() => Zone, (zone) => zone.spaces)
  @JoinColumn({ name: 'zone_id' })
  zone!: Zone;

  @OneToMany(() => SpaceUserUsage, (spaceUserUsage) => spaceUserUsage.space)
  space_user_usages!: SpaceUserUsage[];

  @OneToMany(() => Reservation, (reservation) => reservation.space)
  reservations!: Reservation[];
}

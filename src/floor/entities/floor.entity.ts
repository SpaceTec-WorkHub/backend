import {
	Entity,
	Column,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
	JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { Building } from '../../building/entities/building.entity';
import { Zone } from '../../zone/entities/zone.entity';

export enum FloorType {
	office = 'office',
	parking = 'parking',
}

@Entity()
export class Floor extends BaseEntity {
	@PrimaryGeneratedColumn({ type: 'integer' })
	floor_id!: number;

	@Column({ type: 'varchar' })
	name!: string;

	@Column({ type: 'integer' })
	building_id!: number;

	@Column({ type: 'enum', enum: FloorType, default: FloorType.office })
	floor_type!: FloorType;

	@ManyToOne(() => Building, (building) => building.floors)
	@JoinColumn({ name: 'building_id' })
	building!: Building;

	@OneToMany(() => Zone, (zone) => zone.floor)
	zones!: Zone[];
}

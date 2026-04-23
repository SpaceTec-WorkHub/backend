import { Entity, Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { Building } from '../../building/entities/building.entity';

@Entity()
export class Site extends BaseEntity {
	@PrimaryGeneratedColumn({ type: 'integer' })
	site_id!: number;

	@Column({ type: 'varchar', unique: true })
	name!: string;

	@OneToMany(() => Building, (building) => building.site)
	buildings!: Building[];
}

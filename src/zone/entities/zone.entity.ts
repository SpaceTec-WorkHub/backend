import {
	Entity,
	Column,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
	JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { Floor } from '../../floor/entities/floor.entity';
import { Space } from '../../space/entities/space.entity';

@Entity()
export class Zone extends BaseEntity {
	@PrimaryGeneratedColumn({ type: 'integer' })
	zone_id!: number;

	@Column({ type: 'varchar' })
	name!: string;

	@Column({ type: 'integer' })
	floor_id!: number;

	@ManyToOne(() => Floor, (floor) => floor.zones)
	@JoinColumn({ name: 'floor_id' })
	floor!: Floor;

	@OneToMany(() => Space, (space) => space.zone)
	spaces!: Space[];
}

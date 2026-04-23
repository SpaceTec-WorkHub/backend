import {
	Entity,
	PrimaryColumn,
	ManyToOne,
	JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { User } from '../../user/entities/user.entity';
import { Space } from '../../space/entities/space.entity';

@Entity()
export class SpaceUserUsage extends BaseEntity {
	@PrimaryColumn({ type: 'integer' })
	user_id!: number;

	@PrimaryColumn({ type: 'integer' })
	space_id!: number;

	@ManyToOne(() => User, (user) => user.space_user_usages)
	@JoinColumn({ name: 'user_id' })
	user!: User;

	@ManyToOne(() => Space, (space) => space.space_user_usages)
	@JoinColumn({ name: 'space_id' })
	space!: Space;
}

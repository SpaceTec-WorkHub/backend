import {
  Entity,
  ManyToOne,
  PrimaryColumn,
  JoinColumn,
  Column,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Badge } from './badge.entity';

@Entity()
export class UserBadge {
  @PrimaryColumn({ type: 'integer' })
  user_id!: number;

  @PrimaryColumn({ type: 'integer' })
  badge_id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  unlocked_at!: Date;

  @ManyToOne(() => User, (user) => user.badges)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Badge, (badge) => badge.users)
  @JoinColumn({ name: 'badge_id' })
  badge!: Badge;
}

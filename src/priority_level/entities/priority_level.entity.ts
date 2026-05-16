import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { Visit } from '../../visit/entities/visit.entity';
import { UserNeed } from '../../user_need/entities/user_need.entity';

@Entity()
export class PriorityLevel extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  priority_level_id!: number;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar' })
  scale!: string;

  @OneToMany(() => Visit, (visit) => visit.priorityLevel)
  visits!: Visit[];

  @OneToMany(() => UserNeed, (userNeed) => userNeed.priorityLevel)
  userNeeds!: UserNeed[];
}

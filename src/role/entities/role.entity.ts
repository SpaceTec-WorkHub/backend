import { Entity, Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { User } from '../../user/entities/user.entity';

@Entity()
export class Role extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  role_id: number;

  @Column({ type: 'varchar', unique: true })
  name: string;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}

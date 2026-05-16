import { Entity, Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { Space } from '../../space/entities/space.entity';

@Entity()
export class SpaceType extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  space_type_id!: number;

  @Column({ type: 'varchar', unique: true })
  name!: string;

  @OneToMany(() => Space, (space) => space.space_type)
  spaces!: Space[];
}

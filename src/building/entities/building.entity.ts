import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { Site } from '../../site/entities/site.entity';
import { Floor } from '../../floor/entities/floor.entity';

@Entity()
export class Building extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  building_id!: number;

  @Column({ type: 'varchar' })  
  name!: string;

  @Column({ type: 'integer' })
  site_id!: number;

  @ManyToOne(() => Site, (site) => site.buildings)
  @JoinColumn({ name: 'site_id' })
  site!: Site;

  @OneToMany(() => Floor, (floor) => floor.building)
  floors!: Floor[];
}

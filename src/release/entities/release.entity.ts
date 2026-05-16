import {
	Entity,
	Column,
	OneToOne,
	PrimaryGeneratedColumn,
	JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { Reservation } from '../../reservation/entities/reservation.entity';

@Entity()
export class Release extends BaseEntity {
	@PrimaryGeneratedColumn({ type: 'integer' })
	release_id!: number;

	@Column({ type: 'varchar' })
	reason!: string;

	@Column({ type: 'timestamp' })
	release_time!: Date;

	@Column({ type: 'integer', unique: true })
	reservation_id!: number;

	@OneToOne(() => Reservation, (reservation) => reservation.release)
	@JoinColumn({ name: 'reservation_id' })
	reservation!: Reservation;
}

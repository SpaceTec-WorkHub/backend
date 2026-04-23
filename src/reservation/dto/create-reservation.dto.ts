import {
	IsDateString,
	IsNotEmpty,
	IsNumber,
	IsEnum,
} from 'class-validator';
import { ReservationStatus } from '../entities/reservation.entity';

export class CreateReservationDto {
	@IsDateString()
	@IsNotEmpty()
	start_time!: string;

	@IsDateString()
	@IsNotEmpty()
	end_time!: string;

	@IsEnum(ReservationStatus)
	@IsNotEmpty()
	status!: ReservationStatus;

	@IsNumber()
	@IsNotEmpty()
	user_id!: number;

	@IsNumber()
	@IsNotEmpty()
	space_id!: number;
}

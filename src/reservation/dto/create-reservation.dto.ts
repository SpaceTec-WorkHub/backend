import {
	IsDateString,
	IsNotEmpty,
	IsNumber,
	IsEnum,
	IsString,
	IsOptional,
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

	@IsString()
	@IsNotEmpty()
	code!: string;

	@IsNumber()
	@IsNotEmpty()
	user_id!: number;

	@IsNumber()
	@IsNotEmpty()
	space_id!: number;

	@IsNumber()
	@IsOptional()
	event_id?: number;
}

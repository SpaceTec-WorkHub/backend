import { IsDateString, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ReservationStatus } from '../entities/reservation.entity';

export class UpdateReservationDto {
	@IsOptional()
	@IsDateString()
	start_time?: string;

	@IsOptional()
	@IsDateString()
	end_time?: string;

	@IsOptional()
	@IsEnum(ReservationStatus)
	status?: ReservationStatus;

	@IsOptional()
	@IsNumber()
	user_id?: number;

	@IsOptional()
	@IsNumber()
	space_id?: number;
}

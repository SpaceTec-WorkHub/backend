import { IsDateString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateReservationDto {
	@IsDateString()
	@IsNotEmpty()
	start_time!: string;

	@IsDateString()
	@IsNotEmpty()
	end_time!: string;

	@IsNumber()
	@IsNotEmpty()
	user_id!: number;

	@IsNumber()
	@IsNotEmpty()
	space_id!: number;
}

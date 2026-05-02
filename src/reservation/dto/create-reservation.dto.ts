import { IsDateString, IsNotEmpty, IsNumber 	IsString,
	IsOptional,
} from 'class-validator';

export class CreateReservationDto {
	@IsDateString()
	@IsNotEmpty()
	start_time!: string;

	@IsDateString()
	@IsNotEmpty()
	end_time!: string;

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

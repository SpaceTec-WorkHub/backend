import { IsDateString, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateReleaseDto {
	@IsString()
	@IsNotEmpty()
	reason!: string;

	@IsDateString()
	@IsNotEmpty()
	release_time!: string;

	@IsNumber()
	@IsNotEmpty()
	reservation_id!: number;
}

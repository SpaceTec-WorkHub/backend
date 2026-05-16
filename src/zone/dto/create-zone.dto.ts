import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateZoneDto {
	@IsString()
	@IsNotEmpty()
	name!: string;

	@IsNumber()
	@IsNotEmpty()
	floor_id!: number;
}

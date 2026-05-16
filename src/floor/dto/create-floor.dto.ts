import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateFloorDto {
	@IsString()
	@IsNotEmpty()
	name!: string;

	@IsNumber()
	@IsNotEmpty()
	building_id!: number;
}

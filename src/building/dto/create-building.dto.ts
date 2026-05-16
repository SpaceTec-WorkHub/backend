import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateBuildingDto {
	@IsString()
	@IsNotEmpty()
	name!: string;

	@IsNumber()
	@IsNotEmpty()
	site_id!: number;
}

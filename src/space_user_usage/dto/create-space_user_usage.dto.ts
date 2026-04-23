import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateSpaceUserUsageDto {
	@IsNumber()
	@IsNotEmpty()
	user_id!: number;

	@IsNumber()
	@IsNotEmpty()
	space_id!: number;
}

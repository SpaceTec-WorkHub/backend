import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSiteDto {
	@IsString()
	@IsNotEmpty()
	name!: string;
}

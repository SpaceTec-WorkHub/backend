import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSpaceTypeDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

import { IsString, IsNotEmpty } from 'class-validator';

export class CreatePriorityLevelDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  scale!: string;
}

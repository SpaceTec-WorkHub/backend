import { IsNotEmpty, IsString, IsDateString, IsNumber } from 'class-validator';

export class CreateBlockDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsDateString()
  @IsNotEmpty()
  start_time!: string;

  @IsDateString()
  @IsNotEmpty()
  end_time!: string;

  @IsNumber()
  @IsNotEmpty()
  space_id!: number;
}

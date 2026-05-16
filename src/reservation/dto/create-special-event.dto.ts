import { IsDateString, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateSpecialEventDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsDateString()
  @IsNotEmpty()
  start_time!: string;

  @IsDateString()
  @IsNotEmpty()
  end_time!: string;

  @IsNumber()
  @IsNotEmpty()
  zone_id!: number;

  @IsNumber()
  @IsNotEmpty()
  user_id!: number;
}
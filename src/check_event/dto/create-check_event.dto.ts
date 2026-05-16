import { IsString, IsNotEmpty, IsNumber, IsDateString } from 'class-validator';

export class CreateCheckEventDto {
  @IsString()
  @IsNotEmpty()
  event_type!: string;

  @IsString()
  @IsNotEmpty()
  method!: string;

  @IsDateString()
  @IsNotEmpty()
  event_time!: Date;

  @IsNumber()
  @IsNotEmpty()
  reservation_id!: number;
}

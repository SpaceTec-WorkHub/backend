import { IsDateString, IsNumber, IsOptional } from 'class-validator';

export class ExtendReservationDto {
  @IsNumber()
  user_id!: number;

  @IsDateString()
  new_end_time!: string;

  @IsOptional()
  is_admin?: boolean;
}
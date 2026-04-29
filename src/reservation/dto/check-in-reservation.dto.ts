import { IsNumber, IsOptional } from 'class-validator';

export class CheckInReservationDto {
  @IsNumber()
  user_id!: number;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  is_admin?: boolean;
}
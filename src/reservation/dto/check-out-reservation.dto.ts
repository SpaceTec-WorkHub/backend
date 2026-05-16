import { IsNumber, IsOptional } from 'class-validator';

export class CheckOutReservationDto {
  @IsNumber()
  user_id!: number;

  @IsOptional()
  is_admin?: boolean;
}
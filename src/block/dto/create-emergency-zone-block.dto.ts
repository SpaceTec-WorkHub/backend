import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateEmergencyZoneBlockDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsDateString()
  @IsNotEmpty()
  start_time!: string;

  @IsOptional()
  @IsDateString()
  end_time?: string;

  @IsNumber()
  @IsNotEmpty()
  zone_id!: number;
}
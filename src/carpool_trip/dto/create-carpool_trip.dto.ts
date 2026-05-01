import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CarpoolTripStatus } from '../entities/carpool_trip.entity';

export class CreateCarpoolTripDto {
  @IsDateString()
  trip_date!: string;

  @IsEnum(CarpoolTripStatus)
  @IsOptional()
  status?: CarpoolTripStatus;

  @IsNumber()
  @Min(1)
  seats_total!: number;

  @IsNumber()
  vehicle_id!: number;

  @IsString()
  @IsNotEmpty()
  origin!: string;

  @IsString()
  @IsNotEmpty()
  destination!: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  driver_id!: number;
}

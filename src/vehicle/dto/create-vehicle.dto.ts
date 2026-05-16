import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  plate_number!: string;

  @IsString()
  @IsNotEmpty()
  brand!: string;

  @IsString()
  @IsNotEmpty()
  model!: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsInt()
  @IsOptional()
  year?: number;

  @IsInt()
  @Min(1)
  seats_total!: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsInt()
  owner_id!: number;
}

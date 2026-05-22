import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsIn,
} from 'class-validator';
import { FloorType } from '../entities/floor.entity';

export class CreateFloorDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @IsNotEmpty()
  building_id!: number;

  @IsOptional()
  @IsIn(Object.values(FloorType))
  floor_type?: FloorType;
}

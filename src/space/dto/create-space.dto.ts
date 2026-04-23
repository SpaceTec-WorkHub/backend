import { IsNotEmpty, IsString, IsBoolean, IsNumber, IsEnum } from 'class-validator';
import { SpaceStatus } from '../entities/space.entity';

export class CreateSpaceDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsBoolean()
  @IsNotEmpty()
  is_accessible!: boolean;

  @IsBoolean()
  @IsNotEmpty()
  is_priority!: boolean;

  @IsEnum(SpaceStatus)
  @IsNotEmpty()
  status!: SpaceStatus;

  @IsNumber()
  @IsNotEmpty()
  space_type_id!: number;

  @IsNumber()
  @IsNotEmpty()
  zone_id!: number;
}

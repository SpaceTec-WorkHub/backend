import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateBadgeDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsString()
  @IsNotEmpty()
  icon!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  criteria!: string;

  @IsNumber()
  @IsOptional()
  points_reward?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

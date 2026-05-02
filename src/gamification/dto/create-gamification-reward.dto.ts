import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateGamificationRewardDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsInt()
  points!: number;

  @IsOptional()
  period_start?: string;

  @IsOptional()
  period_end?: string;
}
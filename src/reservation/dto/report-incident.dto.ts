import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { IncidentType } from '../entities/incident.entity';

export class ReportIncidentDto {
  @IsNumber()
  user_id!: number;

  @IsString()
  @IsNotEmpty()
  type!: IncidentType;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  is_admin?: boolean;
}
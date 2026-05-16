import { IsString, IsNotEmpty, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { VisitStatus } from '../entities/visit.entity';

export class CreateVisitDto {
  @IsString()
  @IsNotEmpty()
  visitor_name!: string;

  @IsString()
  @IsNotEmpty()
  company!: string;

  @IsDateString()
  @IsNotEmpty()
  visit_date!: Date;

  @IsEnum(VisitStatus)
  @IsNotEmpty()
  status!: VisitStatus;

  @IsNumber()
  @IsNotEmpty()
  priority_level_id!: number;

  @IsNumber()
  @IsNotEmpty()
  user_id!: number;
}

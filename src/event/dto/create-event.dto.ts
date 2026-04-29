import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { EventStatus } from '../entities/event.entity';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsDateString()
  @IsNotEmpty()
  start_time!: Date;

  @IsDateString()
  @IsNotEmpty()
  end_time!: Date;

  @IsNumber()
  @IsOptional()
  expected_attendees?: number;

  @IsEnum(EventStatus)
  @IsNotEmpty()
  status!: EventStatus;

  @IsNumber()
  @IsNotEmpty()
  user_need_id!: number;

  @IsNumber()
  @IsNotEmpty()
  created_by!: number;
}

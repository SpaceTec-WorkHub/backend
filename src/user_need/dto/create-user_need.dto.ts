import { IsString, IsNotEmpty, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { UserNeedStatus } from '../entities/user_need.entity';

export class CreateUserNeedDto {
  @IsString()
  @IsNotEmpty()
  need_type!: string;

  @IsDateString()
  @IsNotEmpty()
  start_date!: Date;

  @IsDateString()
  @IsNotEmpty()
  end_date!: Date;

  @IsEnum(UserNeedStatus)
  @IsNotEmpty()
  status!: UserNeedStatus;

  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsNumber()
  @IsNotEmpty()
  user_id!: number;

  @IsNumber()
  @IsNotEmpty()
  priority_level_id!: number;
}

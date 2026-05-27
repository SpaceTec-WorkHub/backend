import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsString, MaxLength, MinLength } from 'class-validator';
import { NotificationReason } from '../entities/notification.entity';

export class CreateNotificationDto {
  @IsInt()
  @Type(() => Number)
  user_id!: number;

  @IsString()
  @MinLength(3)
  @MaxLength(150)
  title!: string;

  @IsString()
  @MinLength(1)
  content!: string;

  @IsEnum(NotificationReason)
  reason!: NotificationReason;
}

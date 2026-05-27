import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  current_password!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  new_password!: string;

  @IsString()
  @IsNotEmpty()
  confirm_password!: string;
}
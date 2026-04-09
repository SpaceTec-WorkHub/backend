import { IsEnum, IsNotEmpty, IsString, IsInt } from 'class-validator';

export enum UserType {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  email: string | undefined;

  @IsString()
  @IsNotEmpty()
  full_name: string | undefined;

  @IsEnum(UserType)
  user_type: UserType | undefined;

  @IsEnum(UserStatus)
  status: UserStatus | undefined;

  @IsInt()
  role_id: number | undefined;
}

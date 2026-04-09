import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(
  PickType(CreateUserDto, [
    'full_name',
    'email',
    'user_type',
    'status',
    'role_id',
  ]),
) {}

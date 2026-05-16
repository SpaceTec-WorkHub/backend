import { PartialType } from '@nestjs/mapped-types';
import { CreateUserNeedDto } from './create-user_need.dto';

export class UpdateUserNeedDto extends PartialType(CreateUserNeedDto) {}

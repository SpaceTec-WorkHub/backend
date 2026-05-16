import { PartialType } from '@nestjs/mapped-types';
import { CreateSpaceUserUsageDto } from './create-space_user_usage.dto';

export class UpdateSpaceUserUsageDto extends PartialType(CreateSpaceUserUsageDto) {}

import { PartialType } from '@nestjs/mapped-types';
import { CreatePriorityLevelDto } from './create-priority_level.dto';

export class UpdatePriorityLevelDto extends PartialType(CreatePriorityLevelDto) {}

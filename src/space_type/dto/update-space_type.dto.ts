import { PartialType } from '@nestjs/mapped-types';
import { CreateSpaceTypeDto } from './create-space_type.dto';

export class UpdateSpaceTypeDto extends PartialType(CreateSpaceTypeDto) {}

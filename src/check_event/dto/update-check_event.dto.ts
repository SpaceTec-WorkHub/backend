import { PartialType } from '@nestjs/mapped-types';
import { CreateCheckEventDto } from './create-check_event.dto';

export class UpdateCheckEventDto extends PartialType(CreateCheckEventDto) {}

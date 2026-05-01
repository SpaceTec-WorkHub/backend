import { PartialType } from '@nestjs/mapped-types';
import { CreateCarpoolTripDto } from './create-carpool_trip.dto';

export class UpdateCarpoolTripDto extends PartialType(CreateCarpoolTripDto) {}

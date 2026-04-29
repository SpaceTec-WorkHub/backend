import { PartialType } from '@nestjs/mapped-types';
import { CreatePointsLedgerDto } from './create-points_ledger.dto';

export class UpdatePointsLedgerDto extends PartialType(CreatePointsLedgerDto) {}

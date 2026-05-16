import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { OperationType } from '../entities/points_ledger.entity';

export class CreatePointsLedgerDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsNumber()
  @IsNotEmpty()
  points_delta!: number;

  @IsEnum(OperationType)
  @IsNotEmpty()
  operation_type!: OperationType;

  @IsNumber()
  @IsNotEmpty()
  balance!: number;

  @IsString()
  @IsNotEmpty()
  reference_type!: string;

  @IsString()
  @IsOptional()
  reference_id?: string;

  @IsNumber()
  @IsNotEmpty()
  user_id!: number;
}

import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, ArrayNotEmpty } from 'class-validator';

export class CreateSpaceBlocksDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  space_ids!: number[];

  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsDateString()
  @IsNotEmpty()
  start_time!: string;

  @IsDateString()
  @IsOptional()
  end_time?: string;
}
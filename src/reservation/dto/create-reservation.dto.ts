
import { IsBoolean, IsDateString, IsNotEmpty, IsNumber, IsString, IsOptional, IsArray, ValidateNested, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

export class GuestDto {
	@IsString()
	@IsNotEmpty()
	name!: string;

	@IsOptional()
	@IsEmail()
	email?: string;

	@IsOptional()
	@IsNumber()
	extra_parking_space_id?: number;
}

export class CreateReservationDto {
	@IsDateString()
	@IsNotEmpty()
	start_time!: string;

	@IsDateString()
	@IsNotEmpty()
	end_time!: string;

	@IsString()
	@IsNotEmpty()
	code!: string;

	@IsNumber()
	@IsNotEmpty()
	user_id!: number;

	@IsNumber()
	@IsNotEmpty()
	space_id!: number;

	@IsNumber()
	@IsOptional()
	event_id?: number;

	@IsArray()
	@IsOptional()
	@IsNumber({}, { each: true })
	extra_parking_space_ids?: number[];

	@IsArray()
	@IsOptional()
	@ValidateNested({ each: true })
	@Type(() => GuestDto)
	guests?: GuestDto[];

	@IsBoolean()
	@IsOptional()
	is_guest_reservation?: boolean;
}

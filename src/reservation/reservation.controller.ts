import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { CreateSpecialEventDto } from './dto/create-special-event.dto';
import { CheckInReservationDto } from './dto/check-in-reservation.dto';
import { CheckOutReservationDto } from './dto/check-out-reservation.dto';
import { ExtendReservationDto } from './dto/extend-reservation.dto';
import { ReportIncidentDto } from './dto/report-incident.dto';

@Controller('reservation')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  create(@Body() createReservationDto: CreateReservationDto) {
    return this.reservationService.create(createReservationDto);
  }

  @Get()
  findAll() {
    return this.reservationService.findAll();
  }

  @Get('active')
  findActive(
    @Query('user_id') userId?: string,
    @Query('is_admin') isAdmin?: string,
  ) {
    return this.reservationService.findActiveReservations(
      userId ? Number(userId) : null,
      isAdmin === 'true',
    );
  }

  @Get('history')
  findHistory(
    @Query('user_id') userId?: string,
    @Query('is_admin') isAdmin?: string,
  ) {
    return this.reservationService.findReservationHistory(
      userId ? Number(userId) : null,
      isAdmin === 'true',
    );
  }

  @Get('availability/slots')
  getAvailableTimeSlots(@Query('date') date: string) {
    return this.reservationService.findAvailableTimeSlots(date);
  }

  @Get('availability/spaces')
  getAvailableSpaces(
    @Query('date') date: string,
    @Query('start_time') startTime: string,
    @Query('end_time') endTime: string,
  ) {
    return this.reservationService.findAvailableSpaces(date, startTime, endTime);
  }

  @Post('admin/special-event')
  createSpecialEvent(@Body() createSpecialEventDto: CreateSpecialEventDto) {
    return this.reservationService.createSpecialEventReservations(createSpecialEventDto);
  }

  @Post(':id/check-in')
  checkIn(
    @Param('id', ParseIntPipe) id: number,
    @Body() checkInReservationDto: CheckInReservationDto,
  ) {
    return this.reservationService.checkIn(id, checkInReservationDto.user_id, {
      latitude: checkInReservationDto.latitude,
      longitude: checkInReservationDto.longitude,
      isAdmin: checkInReservationDto.is_admin ?? false,
    });
  }

  @Post(':id/check-out')
  checkOut(
    @Param('id', ParseIntPipe) id: number,
    @Body() checkOutReservationDto: CheckOutReservationDto,
  ) {
    return this.reservationService.checkOut(id, checkOutReservationDto.user_id, {
      isAdmin: checkOutReservationDto.is_admin ?? false,
    });
  }

  @Post(':id/extend')
  extendReservation(
    @Param('id', ParseIntPipe) id: number,
    @Body() extendReservationDto: ExtendReservationDto,
  ) {
    return this.reservationService.extendReservation(
      id,
      extendReservationDto.user_id,
      extendReservationDto.new_end_time,
      { isAdmin: extendReservationDto.is_admin ?? false },
    );
  }

  @Post(':id/report-incident')
  reportIncident(
    @Param('id', ParseIntPipe) id: number,
    @Body() reportIncidentDto: ReportIncidentDto,
  ) {
    return this.reservationService.reportIncident(
      id,
      reportIncidentDto.user_id,
      reportIncidentDto,
      { isAdmin: reportIncidentDto.is_admin ?? false },
    );
  }

  @Get('user/:userId')
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.reservationService.findByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reservationService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReservationDto: UpdateReservationDto,
  ) {
    return this.reservationService.update(id, updateReservationDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.reservationService.remove(id);
  }
}

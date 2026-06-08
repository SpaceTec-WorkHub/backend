import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { CarpoolTripService } from './carpool_trip.service';
import { CreateCarpoolTripDto } from './dto/create-carpool_trip.dto';
import { UpdateCarpoolTripDto } from './dto/update-carpool_trip.dto';

@Controller('carpool-trip')
export class CarpoolTripController {
  constructor(private readonly carpoolTripService: CarpoolTripService) {}

  @Post()
  create(@Body() createCarpoolTripDto: CreateCarpoolTripDto) {
    return this.carpoolTripService.create(createCarpoolTripDto);
  }

  @Get()
  findAll() {
    return this.carpoolTripService.findAll();
  }

  @Get('driver/:driverId')
  findByDriver(@Param('driverId', ParseIntPipe) driverId: number) {
    return this.carpoolTripService.findByDriver(driverId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.carpoolTripService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCarpoolTripDto: UpdateCarpoolTripDto,
  ) {
    return this.carpoolTripService.update(id, updateCarpoolTripDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.carpoolTripService.remove(id);
  }

  @Post(':tripId/riders/:userId')
  addRider(
    @Param('tripId', ParseIntPipe) tripId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.carpoolTripService.addRider(tripId, userId);
  }

  @Delete(':tripId/riders/:userId')
  removeRider(
    @Param('tripId', ParseIntPipe) tripId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.carpoolTripService.removeRider(tripId, userId);
  }

  @Patch(':tripId/riders/:userId/accept')
  acceptRider(
    @Param('tripId', ParseIntPipe) tripId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body('driverId', ParseIntPipe) driverId: number,
  ) {
    return this.carpoolTripService.acceptRider(tripId, userId, driverId);
  }

  @Patch(':tripId/riders/:userId/reject')
  rejectRider(
    @Param('tripId', ParseIntPipe) tripId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body('driverId', ParseIntPipe) driverId: number,
  ) {
    return this.carpoolTripService.rejectRider(tripId, userId, driverId);
  }

  @Patch(':tripId/start')
  startTrip(
    @Param('tripId', ParseIntPipe) tripId: number,
    @Body('driverId', ParseIntPipe) driverId: number,
  ) {
    return this.carpoolTripService.startTrip(tripId, driverId);
  }

  @Patch(':tripId/confirm-meeting-point')
  confirmMeetingPoint(
    @Param('tripId', ParseIntPipe) tripId: number,
    @Body('driverId', ParseIntPipe) driverId: number,
  ) {
    return this.carpoolTripService.confirmMeetingPoint(tripId, driverId);
  }

  @Patch(':tripId/complete')
  completeTrip(
    @Param('tripId', ParseIntPipe) tripId: number,
    @Body('driverId', ParseIntPipe) driverId: number,
  ) {
    return this.carpoolTripService.completeTrip(tripId, driverId);
  }

  @Patch(':tripId/cancel')
  cancelTrip(
    @Param('tripId', ParseIntPipe) tripId: number,
    @Body('driverId', ParseIntPipe) driverId: number,
    @Body('reason') reason: string,
  ) {
    return this.carpoolTripService.cancelTrip(tripId, driverId, reason);
  }
}

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
import { StartCarpoolTripDto } from './dto/start-carpool-trip.dto';
import { EndCarpoolTripDto } from './dto/end-carpool-trip.dto';
import { ReportCarpoolTripIncidentDto } from './dto/report-carpool-trip-incident.dto';

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

  @Get('user/:userId')
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.carpoolTripService.findByUser(userId);
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

  @Post(':tripId/riders/:userId/request')
  requestRider(
    @Param('tripId', ParseIntPipe) tripId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.carpoolTripService.requestRider(tripId, userId);
  }

  @Post(':tripId/start')
  startTrip(
    @Param('tripId', ParseIntPipe) tripId: number,
    @Body() startCarpoolTripDto: StartCarpoolTripDto,
  ) {
    return this.carpoolTripService.startTrip(tripId, startCarpoolTripDto);
  }

  @Post(':tripId/end')
  endTrip(
    @Param('tripId', ParseIntPipe) tripId: number,
    @Body() endCarpoolTripDto: EndCarpoolTripDto,
  ) {
    return this.carpoolTripService.endTrip(tripId, endCarpoolTripDto);
  }

  @Post(':tripId/report-incident')
  reportIncident(
    @Param('tripId', ParseIntPipe) tripId: number,
    @Body() reportCarpoolTripIncidentDto: ReportCarpoolTripIncidentDto,
  ) {
    return this.carpoolTripService.reportIncident(
      tripId,
      reportCarpoolTripIncidentDto,
    );
  }

  @Delete(':tripId/riders/:userId')
  removeRider(
    @Param('tripId', ParseIntPipe) tripId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.carpoolTripService.removeRider(tripId, userId);
  }
}

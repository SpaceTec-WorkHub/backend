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
}

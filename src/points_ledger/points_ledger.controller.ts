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
import { PointsLedgerService } from './points_ledger.service';
import { CreatePointsLedgerDto } from './dto/create-points_ledger.dto';
import { UpdatePointsLedgerDto } from './dto/update-points_ledger.dto';

@Controller('points-ledger')
export class PointsLedgerController {
  constructor(private readonly pointsLedgerService: PointsLedgerService) {}

  @Post()
  create(@Body() createPointsLedgerDto: CreatePointsLedgerDto) {
    return this.pointsLedgerService.create(createPointsLedgerDto);
  }

  @Get()
  findAll() {
    return this.pointsLedgerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pointsLedgerService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePointsLedgerDto: UpdatePointsLedgerDto,
  ) {
    return this.pointsLedgerService.update(id, updatePointsLedgerDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.pointsLedgerService.remove(id);
  }
}

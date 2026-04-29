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
import { CheckEventService } from './check_event.service';
import { CreateCheckEventDto } from './dto/create-check_event.dto';
import { UpdateCheckEventDto } from './dto/update-check_event.dto';

@Controller('check-event')
export class CheckEventController {
  constructor(private readonly checkEventService: CheckEventService) {}

  @Post()
  create(@Body() createCheckEventDto: CreateCheckEventDto) {
    return this.checkEventService.create(createCheckEventDto);
  }

  @Get()
  findAll() {
    return this.checkEventService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.checkEventService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCheckEventDto: UpdateCheckEventDto,
  ) {
    return this.checkEventService.update(id, updateCheckEventDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.checkEventService.remove(id);
  }
}

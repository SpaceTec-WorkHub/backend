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
import { PriorityLevelService } from './priority_level.service';
import { CreatePriorityLevelDto } from './dto/create-priority_level.dto';
import { UpdatePriorityLevelDto } from './dto/update-priority_level.dto';

@Controller('priority-level')
export class PriorityLevelController {
  constructor(private readonly priorityLevelService: PriorityLevelService) {}

  @Post()
  create(@Body() createPriorityLevelDto: CreatePriorityLevelDto) {
    return this.priorityLevelService.create(createPriorityLevelDto);
  }

  @Get()
  findAll() {
    return this.priorityLevelService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.priorityLevelService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePriorityLevelDto: UpdatePriorityLevelDto,
  ) {
    return this.priorityLevelService.update(id, updatePriorityLevelDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.priorityLevelService.remove(id);
  }
}

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
import { SpaceTypeService } from './space_type.service';
import { CreateSpaceTypeDto } from './dto/create-space_type.dto';
import { UpdateSpaceTypeDto } from './dto/update-space_type.dto';

@Controller('space-type')
export class SpaceTypeController {
  constructor(private readonly spaceTypeService: SpaceTypeService) {}

  @Post()
  create(@Body() createSpaceTypeDto: CreateSpaceTypeDto) {
    return this.spaceTypeService.create(createSpaceTypeDto);
  }

  @Get()
  findAll() {
    return this.spaceTypeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.spaceTypeService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSpaceTypeDto: UpdateSpaceTypeDto,
  ) {
    return this.spaceTypeService.update(id, updateSpaceTypeDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.spaceTypeService.remove(id);
  }
}

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
import { ReleaseService } from './release.service';
import { CreateReleaseDto } from './dto/create-release.dto';
import { UpdateReleaseDto } from './dto/update-release.dto';

@Controller('release')
export class ReleaseController {
  constructor(private readonly releaseService: ReleaseService) {}

  @Post()
  create(@Body() createReleaseDto: CreateReleaseDto) {
    return this.releaseService.create(createReleaseDto);
  }

  @Get()
  findAll() {
    return this.releaseService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.releaseService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReleaseDto: UpdateReleaseDto,
  ) {
    return this.releaseService.update(id, updateReleaseDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.releaseService.remove(id);
  }
}

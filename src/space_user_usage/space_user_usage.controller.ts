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
import { SpaceUserUsageService } from './space_user_usage.service';
import { CreateSpaceUserUsageDto } from './dto/create-space_user_usage.dto';
import { UpdateSpaceUserUsageDto } from './dto/update-space_user_usage.dto';

@Controller('space-user-usage')
export class SpaceUserUsageController {
  constructor(private readonly spaceUserUsageService: SpaceUserUsageService) {}

  @Post()
  create(@Body() createSpaceUserUsageDto: CreateSpaceUserUsageDto) {
    return this.spaceUserUsageService.create(createSpaceUserUsageDto);
  }

  @Get()
  findAll() {
    return this.spaceUserUsageService.findAll();
  }

  @Get(':userId/:spaceId')
  findOne(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('spaceId', ParseIntPipe) spaceId: number,
  ) {
    return this.spaceUserUsageService.findOne(userId, spaceId);
  }

  @Patch(':userId/:spaceId')
  update(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('spaceId', ParseIntPipe) spaceId: number,
    @Body() updateSpaceUserUsageDto: UpdateSpaceUserUsageDto,
  ) {
    return this.spaceUserUsageService.update(
      userId,
      spaceId,
      updateSpaceUserUsageDto,
    );
  }

  @Delete(':userId/:spaceId')
  remove(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('spaceId', ParseIntPipe) spaceId: number,
  ) {
    return this.spaceUserUsageService.remove(userId, spaceId);
  }
}

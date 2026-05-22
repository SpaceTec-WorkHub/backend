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
import { BlockService } from './block.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { CreateEmergencyZoneBlockDto } from './dto/create-emergency-zone-block.dto';
import { CreateSpaceBlocksDto } from './dto/create-space-blocks.dto';

@Controller('block')
export class BlockController {
  constructor(private readonly blockService: BlockService) {}

  @Post()
  create(@Body() createBlockDto: CreateBlockDto) {
    return this.blockService.create(createBlockDto);
  }

  @Post('spaces')
  createSpaceBlocks(@Body() createSpaceBlocksDto: CreateSpaceBlocksDto) {
    return this.blockService.createSpaceBlocks(createSpaceBlocksDto);
  }

  @Post('emergency-zone')
  createEmergencyZoneBlock(@Body() createEmergencyZoneBlockDto: CreateEmergencyZoneBlockDto) {
    return this.blockService.createEmergencyZoneBlock(createEmergencyZoneBlockDto);
  }

  @Get()
  findAll() {
    return this.blockService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.blockService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBlockDto: UpdateBlockDto,
  ) {
    return this.blockService.update(id, updateBlockDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.blockService.remove(id);
  }
}

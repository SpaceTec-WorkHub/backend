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
import { UserNeedService } from './user_need.service';
import { CreateUserNeedDto } from './dto/create-user_need.dto';
import { UpdateUserNeedDto } from './dto/update-user_need.dto';

@Controller('user-need')
export class UserNeedController {
  constructor(private readonly userNeedService: UserNeedService) {}

  @Post()
  create(@Body() createUserNeedDto: CreateUserNeedDto) {
    return this.userNeedService.create(createUserNeedDto);
  }

  @Get()
  findAll() {
    return this.userNeedService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userNeedService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserNeedDto: UpdateUserNeedDto,
  ) {
    return this.userNeedService.update(id, updateUserNeedDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userNeedService.remove(id);
  }
}

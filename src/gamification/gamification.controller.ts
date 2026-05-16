import { Body, Controller, Delete, Get, Param, Patch, Post, Query, ParseIntPipe } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { CreateGamificationRewardDto } from './dto/create-gamification-reward.dto';
import { UpdateGamificationRewardDto } from './dto/update-gamification-reward.dto';

@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('leaderboard')
  getLeaderboard(@Query('userId') userId?: string) {
    return this.gamificationService.getLeaderboard(userId ? Number(userId) : null);
  }

  @Get('users')
  getUsers() {
    return this.gamificationService.getUsersForRewards();
  }

  @Get('rewards')
  getRewards() {
    return this.gamificationService.getRewards();
  }

  @Post('rewards')
  createReward(@Body() createGamificationRewardDto: CreateGamificationRewardDto) {
    return this.gamificationService.createReward(createGamificationRewardDto);
  }

  @Patch('rewards/:id')
  updateReward(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGamificationRewardDto: UpdateGamificationRewardDto,
  ) {
    return this.gamificationService.updateReward(id, updateGamificationRewardDto);
  }

  @Delete('rewards/:id')
  removeReward(@Param('id', ParseIntPipe) id: number) {
    return this.gamificationService.removeReward(id);
  }
}
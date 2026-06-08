import { Controller, Get, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ParkingService } from './ia_services';

@Controller('parking')
export class ParkingController {
  constructor(private readonly parkingService: ParkingService) {}

  @Get('recommendations')
  async getRecommendations(
    @Query('user_id', new DefaultValuePipe(1), ParseIntPipe) userId: number,
  ) {
    const data = await this.parkingService.getAiRecommendations(userId);
    return { success: true, data };
  }

  @Get('global-recommendations')
  async getGlobalRecommendations(
    @Query('tipo', new DefaultValuePipe(1), ParseIntPipe) tipo: number,
  ) {
    const data = await this.parkingService.getGlobalDayRecommendations(tipo);
    return { success: true, data };
  }
}
import { Controller, Get } from '@nestjs/common';
import { ParkingService } from './ia_services';

@Controller('parking')
export class ParkingController {
  constructor(private readonly parkingService: ParkingService) {}

  @Get('recommendations')
  async getRecommendations() {
    const data = await this.parkingService.getAiRecommendations();
    
    return {
      success: true,
      data: data,
    };
  }
}
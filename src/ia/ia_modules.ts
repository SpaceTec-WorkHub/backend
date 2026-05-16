import { Module } from '@nestjs/common';
import { ParkingController } from './ia_controller';
import { ParkingService } from './ia_services';

@Module({
  imports: [],
  controllers: [ParkingController],
  providers: [ParkingService],
})
export class IaModule {}
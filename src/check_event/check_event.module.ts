import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckEventService } from './check_event.service';
import { CheckEventController } from './check_event.controller';
import { CheckEvent } from './entities/check_event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CheckEvent])],
  controllers: [CheckEventController],
  providers: [CheckEventService],
  exports: [CheckEventService],
})
export class CheckEventModule {}

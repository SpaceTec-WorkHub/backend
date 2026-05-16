import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserNeedService } from './user_need.service';
import { UserNeedController } from './user_need.controller';
import { UserNeed } from './entities/user_need.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserNeed])],
  controllers: [UserNeedController],
  providers: [UserNeedService],
  exports: [UserNeedService],
})
export class UserNeedModule {}

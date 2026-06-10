import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PasswordResetCode } from './entities/password-reset-code.entity';

@Module({
  imports: [
    UserModule,
    NotificationsModule,
    TypeOrmModule.forFeature([PasswordResetCode]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}

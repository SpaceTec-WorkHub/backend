import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { randomInt } from 'crypto';
import bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationReason } from '../notifications/entities/notification.entity';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PasswordResetCode } from './entities/password-reset-code.entity';

const RESET_CODE_TTL_MINUTES = 15;
const RESET_CODE_SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly notificationsService: NotificationsService,
    @InjectRepository(PasswordResetCode)
    private readonly passwordResetCodeRepository: Repository<PasswordResetCode>,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userService.findByEmail(email);

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await this.userService.comparePassword(
      password,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _password, ...safeUser } = user;

    return {
      message: 'Login successful',
      user: safeUser,
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const user = await this.userService.findByEmail(email);

    if (user) {
      const code = randomInt(100000, 1000000).toString();
      const code_hash = await bcrypt.hash(code, RESET_CODE_SALT_ROUNDS);
      const expires_at = new Date(Date.now() + RESET_CODE_TTL_MINUTES * 60 * 1000);

      await this.passwordResetCodeRepository.update(
        { user_id: user.user_id, used: false },
        { used: true },
      );

      const resetCode = this.passwordResetCodeRepository.create({
        user_id: user.user_id,
        code_hash,
        expires_at,
      });
      await this.passwordResetCodeRepository.save(resetCode);

      try {
        await this.notificationsService.create({
          user_id: user.user_id,
          title: 'Código de verificación - WorkHub',
          content: `Tu código de verificación es ${code}. Expira en ${RESET_CODE_TTL_MINUTES} minutos. Si no solicitaste este cambio, puedes ignorar este mensaje.`,
          reason: NotificationReason.PASSWORD_RESET_REQUESTED,
        });
      } catch (error) {
        console.error('Failed to send password reset email', error);
      }
    }

    return {
      message: 'Si existe una cuenta con ese correo, se envió un código de verificación.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, code, new_password, confirm_password } = resetPasswordDto;

    if (new_password !== confirm_password) {
      throw new BadRequestException('New password confirmation does not match');
    }

    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    const resetCode = await this.passwordResetCodeRepository.findOne({
      where: { user_id: user.user_id, used: false, expires_at: MoreThan(new Date()) },
      order: { createdAt: 'DESC' },
    });

    if (!resetCode) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    const codeMatches = await bcrypt.compare(code, resetCode.code_hash);

    if (!codeMatches) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    resetCode.used = true;
    await this.passwordResetCodeRepository.save(resetCode);

    await this.userService.setPassword(user.user_id, new_password);

    try {
      await this.notificationsService.create({
        user_id: user.user_id,
        title: 'Contraseña actualizada',
        content: 'Tu contraseña ha sido actualizada correctamente. Si no realizaste este cambio, contacta a soporte de inmediato.',
        reason: NotificationReason.PASSWORD_RESET_COMPLETED,
      });
    } catch (error) {
      console.error('Failed to send password reset confirmation email', error);
    }

    return { message: 'Password updated successfully' };
  }
}

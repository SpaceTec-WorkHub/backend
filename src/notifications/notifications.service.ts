import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Notification } from './entities/notification.entity';
import { User } from '../user/entities/user.entity';
import { Resend } from 'resend';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  private isResendEnabled() {
    const value = this.configService.get<boolean | string>('RESEND_ENABLED');

    return value === true || value === 'true';
  }

  private getResendClient() {
    if (!this.isResendEnabled()) {
      return null;
    }

    const apiKey = this.configService.get<string>('RESEND_API_KEY');

    if (!apiKey) {
      return null;
    }

    return new Resend(apiKey);
  }

  private getFromAddress() {
    return (
      this.configService.get<string>('RESEND_FROM_EMAIL') ??
      'WorkHub <onboarding@resend.dev>'
    );
  }

  private formatNotificationTime(createdAt: Date) {
    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'short',
      timeStyle: 'medium',
      timeZone: 'America/Monterrey',
    }).format(createdAt);
  }

  private mapNotificationResponse(notification: Notification) {
    return {
      ...notification,
      time: this.formatNotificationTime(notification.createdAt),
    };
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  private buildEmailHtml(notification: Notification, user: User) {
    const safeTitle = this.escapeHtml(notification.title);
    const safeContent = this.escapeHtml(notification.content);
    const safeRecipient = this.escapeHtml(user.full_name ?? 'usuario');

    return `
      <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:32px;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px;border:1px solid #e2e8f0;">
          <p style="margin:0 0 12px;color:#2563eb;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;">WorkHub</p>
          <h1 style="margin:0 0 16px;font-size:24px;color:#0f172a;">${safeTitle}</h1>
          <p style="margin:0;font-size:16px;line-height:1.7;color:#334155;">Hola ${safeRecipient},</p>
          <p style="margin:16px 0 0;font-size:16px;line-height:1.7;color:#334155;">${safeContent}</p>
        </div>
      </div>
    `;
  }

  private async sendEmail(notification: Notification, user: User) {
    if (!this.isResendEnabled()) {
      return null;
    }

    if (!user.email) {
      throw new BadRequestException('User does not have an email configured');
    }

    const resend = this.getResendClient();

    if (!resend) {
      throw new BadRequestException('RESEND_API_KEY is not configured');
    }

    const response = await resend.emails.send({
      from: this.getFromAddress(),
      to: user.email,
      subject: notification.title,
      html: this.buildEmailHtml(notification, user),
      text: notification.content,
    });

    return response.data?.id ?? null;
  }

  private async getNotificationOrFail(id: number) {
    const notification = await this.notificationRepository.findOne({
      where: { notification_id: id },
      relations: ['user'],
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  async create(createNotificationDto: CreateNotificationDto) {
    const user = await this.userRepository.findOne({
      where: { user_id: createNotificationDto.user_id },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${createNotificationDto.user_id} not found`,
      );
    }

    const notification = this.notificationRepository.create();
    notification.user = user;
    notification.title = createNotificationDto.title;
    notification.content = createNotificationDto.content;
    notification.reason = createNotificationDto.reason;

    const savedNotification = await this.notificationRepository.save(notification);

    try {
      await this.sendEmail(savedNotification, user);
    } catch (error) {
      console.error('Failed to send notification email', error);
    }

    return this.mapNotificationResponse(savedNotification);
  }

  findAll() {
    return this.notificationRepository
      .find({
        relations: ['user'],
        order: { createdAt: 'DESC' },
      })
      .then((notifications) =>
        notifications.map((notification) =>
          this.mapNotificationResponse(notification),
        ),
      );
  }

  findByUser(userId: number) {
    return this.notificationRepository
      .find({
        where: { user: { user_id: userId } },
        relations: ['user'],
        order: { createdAt: 'DESC' },
      })
      .then((notifications) =>
        notifications.map((notification) =>
          this.mapNotificationResponse(notification),
        ),
      );
  }

  async findOne(id: number) {
    const notification = await this.getNotificationOrFail(id);

    return this.mapNotificationResponse(notification);
  }

  async update(id: number, updateNotificationDto: UpdateNotificationDto) {
    const notification = await this.getNotificationOrFail(id);
    const { reason, title, content } = updateNotificationDto as Partial<{
      reason: Notification['reason'];
      title: Notification['title'];
      content: Notification['content'];
    }>;

    if (reason) {
      notification.reason = reason;
    }

    if (title !== undefined) {
      notification.title = title;
    }

    if (content !== undefined) {
      notification.content = content;
    }

    const savedNotification = await this.notificationRepository.save(notification);

    return this.mapNotificationResponse(savedNotification);
  }

  async remove(id: number) {
    const notification = await this.getNotificationOrFail(id);

    await this.notificationRepository.softRemove(notification);

    return this.mapNotificationResponse(notification);
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Handlebars from 'handlebars';
import { AppNotification } from '@twomc/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationEmailService {
  private readonly logger = new Logger(NotificationEmailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;
  private readonly layout: HandlebarsTemplateDelegate;
  private readonly notificationTpl: HandlebarsTemplateDelegate;
  private readonly digestTpl: HandlebarsTemplateDelegate;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = Number(this.config.get<string>('SMTP_PORT') ?? 587);
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASSWORD');
    const fromName = this.config.get<string>('SMTP_FROM_NAME') ?? 'TwoMC';
    const fromEmail = this.config.get<string>('SMTP_FROM_EMAIL') ?? 'noreply@twomc.su';
    this.from = `"${fromName}" <${fromEmail}>`;

    if (host && user && pass) {
      this.transporter = createTransport({
        host,
        port,
        secure: this.config.get<string>('SMTP_SECURE') === 'true',
        auth: { user, pass },
      });
    } else {
      this.transporter = null;
      this.logger.warn('SMTP is not configured; email notifications disabled');
    }

    const templatesDir = join(__dirname, 'templates');
    this.layout = Handlebars.compile(this.readTemplate(templatesDir, 'layout.hbs'));
    this.notificationTpl = Handlebars.compile(this.readTemplate(templatesDir, 'notification.hbs'));
    this.digestTpl = Handlebars.compile(this.readTemplate(templatesDir, 'digest.hbs'));
  }

  async sendNotification(userId: string, notification: AppNotification): Promise<boolean> {
    if (!this.transporter) return false;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, username: true },
    });
    if (!user?.email) return false;

    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'https://twomc.su';
    const body = this.notificationTpl({
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl || notification.link
        ? `${frontendUrl}${notification.actionUrl || notification.link}`
        : null,
      actionLabel: notification.actionLabel ?? 'Открыть',
      username: user.username,
    });

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: user.email,
        subject: notification.title,
        html: this.layout({ content: body, year: new Date().getFullYear() }),
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${user.email}: ${String(error)}`);
      return false;
    }
  }

  async sendDigest(userId: string, notifications: AppNotification[]): Promise<boolean> {
    if (!this.transporter || notifications.length === 0) return false;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, username: true },
    });
    if (!user?.email) return false;

    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'https://twomc.su';
    const body = this.digestTpl({
      username: user.username,
      count: notifications.length,
      items: notifications.map((item) => ({
        title: item.title,
        message: item.message,
        url: item.link ? `${frontendUrl}${item.link}` : `${frontendUrl}/profile/notifications`,
      })),
    });

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: user.email,
        subject: `Дайджест уведомлений (${notifications.length})`,
        html: this.layout({ content: body, year: new Date().getFullYear() }),
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to send digest to ${user.email}: ${String(error)}`);
      return false;
    }
  }

  private readTemplate(dir: string, name: string): string {
    try {
      return readFileSync(join(dir, name), 'utf8');
    } catch {
      return '<div>{{content}}</div>';
    }
  }
}

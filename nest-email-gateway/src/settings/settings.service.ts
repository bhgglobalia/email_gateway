import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mailbox } from '../entities/mailbox.entity';

export function maskDbUrl(url?: string | null) {
  if (!url) return null;

  return url.replace(
    /(\w+):\/\/(.*?):(.*?)@(.*)/,
    (match, protocol, user, password, rest) => {
      const maskedPw =
        password.length > 2
          ? password.slice(0, 1) + '••••••' + password.slice(-1)
          : '••••••';
      return `${protocol}://${user}:${maskedPw}@${rest}`;
    },
  );
}

export function maskSecret(val?: string) {
  if (!val) return null;
  if (val.length <= 6) return '••••••';
  return `${val.slice(0, 3)}••••••${val.slice(-3)}`;
}

@Injectable()
export class SettingsService {
  constructor(@InjectRepository(Mailbox) private repo: Repository<Mailbox>) {}

  getMaskedKeys() {
    return {
      jwtSecret: maskSecret(process.env.JWT_SECRET),
      googleClientId: maskSecret(process.env.GMAIL_CLIENT_ID),
      googleClientSecret: maskSecret(process.env.GMAIL_CLIENT_SECRET),
      msClientId: maskSecret(process.env.MS_CLIENT_ID),
      msClientSecret: maskSecret(process.env.MS_CLIENT_SECRET),
      databaseUrl: maskDbUrl(process.env.DATABASE_URL),
    };
  }

  async getTokenExpiryInfo() {
    const mailboxes = await this.repo.find({
      select: ['email', 'provider', 'tokenExpiresAt'],
    });
    return mailboxes.map((m) => ({
      email: m.email,
      provider: m.provider,
      tokenExpiresAt: m.tokenExpiresAt,
    }));
  }

  async getWorkerHealth() {
    return {
      status: 'ok',
      lastPing: new Date(),
    };
  }

  getWebhookUrls() {
    const base =
      process.env.PUBLIC_URL ||
      process.env.NGROK_URL ||
      `http://localhost:${process.env.PORT || 3000}`;
    return {
      gmail: `${base}/webhook/gmail`,
      outlook: `${base}/webhook/outlook`,
      genericEvents: `${base}/events`,
    };
  }

  async workerHealth() {
    return {
      reachable: true,
      note: 'In-memory demo worker. Replace with bullmq/Redis checks in prod.',
    };
  }

  async tokenExpiryInfo() {
    const mbs = await this.repo.find();
    return mbs.map((m) => ({
      id: m.id,
      email: m.email,
      provider: m.provider,
      tokenExpiresAt: m.tokenExpiresAt,
      willExpireInSeconds: m.tokenExpiresAt
        ? Math.max(
            0,
            Math.floor((m.tokenExpiresAt.getTime() - Date.now()) / 1000),
          )
        : null,
    }));
  }
}

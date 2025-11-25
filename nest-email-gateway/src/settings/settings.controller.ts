import { Controller, Get, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private svc: SettingsService) {}
  @Get('masked-keys')
  getMaskedKeys() {
    return this.svc.getMaskedKeys();
  }

  @Get('webhooks')
  getWebhookUrls() {
    return this.svc.getWebhookUrls();
  }

  @Get('worker-health')
  getWorkerHealth() {
    return this.svc.getWorkerHealth();
  }

  @Get('token-expiry')
  getTokenExpiryInfo() {
    return this.svc.getTokenExpiryInfo();
  }

  @Get()
  async all() {
    const keys = this.svc.getMaskedKeys();
    const webhooks = this.svc.getWebhookUrls();
    const worker = await this.svc.workerHealth();
    const tokens = await this.svc.tokenExpiryInfo();
    return {
      success: true,
      data: {
        apiKeys: keys,
        webhookUrls: webhooks,
        worker,
        mailboxes: tokens,
      },
    };
  }

  @Get('ping/app')
  ping() {
    return {
      success: true,
      ts: new Date().toISOString(),
      service: 'nest-email-gateway',
    };
  }

  @Get('ping/worker')
  async pingWorker() {
    const worker = await this.svc.workerHealth();
    return { success: true, data: worker };
  }
}

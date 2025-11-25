import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Res,
  UseGuards,
  Req,
  Post,
} from '@nestjs/common';
import { MailboxesService } from './mailboxes.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

import { ConfigService } from '@nestjs/config';
import type { Response, Request } from 'express';
import { OAuthCallbackQueryDto } from './dto/oauth-callback-query.dto';
import { OAuthRedirectQueryDto } from './dto/oauth-redirect-query.dto';
import { oauthConfig } from '../config/oauth.config';
import { SkipThrottle } from '@nestjs/throttler';
import { createHmac, randomBytes } from 'crypto';
@Controller('mailboxes')
@SkipThrottle()
export class MailboxesController {
  constructor(
    private svc: MailboxesService,
    private config: ConfigService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async all(@Query('skip') skip?: string, @Query('take') take?: string) {
    const s = Number.isFinite(Number(skip)) ? Number(skip) : 0;
    const t = Number.isFinite(Number(take)) ? Number(take) : 100;
    const data = await this.svc.findAll(s, t);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/refresh')
  async refresh(@Param('id') id: string) {
    const data = await this.svc.refreshTokenExpiry(Number(id), 3600);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Get('active/count')
  async countActive() {
    const count = await this.svc.countActive();
    return { success: true, count };
  }

  @UseGuards(JwtAuthGuard)
  @Post('tokens')
  async saveTokensJson(@Body() body: any) {
    const {
      email,
      provider,
      accessToken,
      refreshToken,
      expiresInSecs,
      clientId,
    } = body || {};
    const data = await this.svc.saveTokens(
      email,
      provider,
      accessToken,
      refreshToken,
      expiresInSecs,
      clientId,
    );
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Get('oauth/:provider')
  async oauthRedirect(
    @Param('provider') provider: string,
    @Query() q: OAuthRedirectQueryDto,
    @Req() req?: Request,
  ) {
    const clientId = q.clientId;
    const email = q.email || (q as any).outlook;
    const secret =
      this.config.get<string>('OAUTH_STATE_SECRET') ||
      this.config.get<string>('JWT_SECRET') ||
      'dev_state_secret';
    const userSub = (req as any)?.user?.sub || (req as any)?.user?.id || null;
    const nonce = randomBytes(8).toString('hex');
    const ts = Date.now();

    if (provider === 'google') {
      const googleClientId = this.config.get<string>('GMAIL_CLIENT_ID');
      if (!googleClientId) {
        return {
          success: false,
          message: 'GMAIL_CLIENT_ID is not configured on the server',
        };
      }
      const base =
        this.config.get<string>('PUBLIC_URL') || 'http://localhost:3000';
      const payloadObj = { clientId, email, ts, nonce, sub: userSub };
      const payload = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
      const sig = createHmac('sha256', secret).update(payload).digest('hex');
      const statePayload = payload ? `${payload}.${sig}` : '';
      return {
        success: true,
        redirectUrl:
          'https://accounts.google.com/o/oauth2/v2/auth?' +
          'client_id=' +
          googleClientId +
          '&redirect_uri=' +
          encodeURIComponent(base + '/mailboxes/callback/google') +
          '&response_type=code' +
          '&scope=' +
          encodeURIComponent(oauthConfig.google.scopes) +
          '&access_type=offline' +
          '&prompt=consent' +
          '&include_granted_scopes=true' +
          (statePayload ? `&state=${encodeURIComponent(statePayload)}` : ''),
      };
    }
    if (provider === 'microsoft' || provider === 'outlook') {
      const msClientId =
        this.config.get<string>('MS_CLIENT_ID') ||
        this.config.get<string>('MICROSOFT_CLIENT_ID');
      if (!msClientId) {
        return {
          success: false,
          message: 'MICROSOFT_CLIENT_ID is not configured on the server',
        };
      }
      const base =
        this.config.get<string>('PUBLIC_URL') || 'http://localhost:3000';
      const redirect = base + '/mailboxes/callback/microsoft';
      const scope = encodeURIComponent(oauthConfig.microsoft.scopes);
      const payloadObj = { clientId, email, ts, nonce, sub: userSub };
      const payload = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
      const sig = createHmac('sha256', secret).update(payload).digest('hex');
      const statePayload = payload ? `${payload}.${sig}` : '';
      const state = statePayload
        ? `&state=${encodeURIComponent(statePayload)}`
        : '';
      const url =
        'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?' +
        'client_id=' +
        msClientId +
        '&redirect_uri=' +
        encodeURIComponent(redirect) +
        '&response_type=code' +
        '&scope=' +
        scope +
        state;
      return { success: true, redirectUrl: url };
    }
    return { success: false, message: 'Unknown provider' };
  }

  @Get('callback/:provider')
  async callback(
    @Param('provider') provider: string,
    @Query() q: OAuthCallbackQueryDto,
    @Res() res: Response,
  ) {
    let email = q.email;
    let clientId = q.clientId;

    const rawState = q.state;
    if (rawState) {
      try {
        const secret =
          this.config.get<string>('OAUTH_STATE_SECRET') ||
          this.config.get<string>('JWT_SECRET') ||
          'dev_state_secret';
        const [payload, sig] = String(rawState).split('.');
        const expected = createHmac('sha256', secret).update(payload).digest('hex');
        if (sig && expected === sig) {
          const decoded = JSON.parse(
            Buffer.from(payload, 'base64url').toString('utf-8'),
          );
          email = decoded?.email || email;
          clientId = decoded?.clientId || clientId;
        } else {
          const frontend =
            this.config.get<string>('FRONTEND_ORIGIN') || 'http://localhost:3001';
          const msg = encodeURIComponent('Invalid OAuth state');
          return res.redirect(frontend + '/dashboard/mailboxes?error=' + msg);
        }
      } catch {
        void 0;
      }
    }
    email = email || `user@${provider}.example`;
    const frontend =
      this.config.get<string>('FRONTEND_ORIGIN') || 'http://localhost:3001';
    try {
      const base = this.config.get<string>('PUBLIC_URL') || 'http://localhost:3000';
      let tokenUrl = '';
      const params = new URLSearchParams();
      if (provider === 'google') {
        const client_id = this.config.get<string>('GMAIL_CLIENT_ID');
        const client_secret = this.config.get<string>('GMAIL_CLIENT_SECRET');
        params.set('client_id', String(client_id));
        params.set('client_secret', String(client_secret));
        params.set('code', String(q.code));
        params.set('redirect_uri', base + '/mailboxes/callback/google');
        params.set('grant_type', 'authorization_code');
        tokenUrl = 'https://oauth2.googleapis.com/token';
      } else if (provider === 'microsoft' || provider === 'outlook') {
        const client_id =
          this.config.get<string>('MS_CLIENT_ID') ||
          this.config.get<string>('MICROSOFT_CLIENT_ID');
        const client_secret =
          this.config.get<string>('MS_CLIENT_SECRET') ||
          this.config.get<string>('MICROSOFT_CLIENT_SECRET');
        params.set('client_id', String(client_id));
        params.set('client_secret', String(client_secret));
        params.set('code', String(q.code));
        params.set('redirect_uri', base + '/mailboxes/callback/microsoft');
        params.set('grant_type', 'authorization_code');
        tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
      } else {
        const msg = encodeURIComponent('Unknown provider');
        return res.redirect(frontend + '/dashboard/mailboxes?error=' + msg);
      }

      const resp = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      const json: any = await resp.json();
      if (!resp.ok || !json?.access_token) {
        const errMsg = encodeURIComponent(json?.error_description || json?.error || 'Token exchange failed');
        return res.redirect(frontend + '/dashboard/mailboxes?error=' + errMsg);
      }

      const accessToken = String(json.access_token);
      const refreshToken = json.refresh_token ? String(json.refresh_token) : undefined;
      const expiresInSecs = Number(json.expires_in) || 3600;

      await this.svc.saveTokens(
        email,
        provider,
        accessToken,
        refreshToken,
        expiresInSecs,
        clientId,
      );
      return res.redirect(
        frontend +
          '/dashboard/mailboxes?connected=' +
          encodeURIComponent(provider),
      );
    } catch (e: any) {
      const msg = encodeURIComponent(e?.message || 'Failed to link mailbox');
      return res.redirect(frontend + '/dashboard/mailboxes?error=' + msg);
    }
  }
}

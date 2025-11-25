import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import type { Request as ExpressRequest } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';

@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) {
      return { success: false, message: 'Invalid credentials' };
    }
    const token = await this.authService.login(user);
    return { success: true, ...token };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: ExpressRequest) {
    return { success: true, user: req.user };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Request() req: ExpressRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    const user = req.user as any;
    const userId = user?.id || user?.sub;
    return this.authService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}

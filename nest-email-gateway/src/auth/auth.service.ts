import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entities/user.entity';

export interface AuthUserSummary {
  id: string;
  email: string;
  role: string;
  mustChangePassword?: boolean;
}

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwt: JwtService,
  ) {}

  private readonly logger = new Logger(AuthService.name);

  private isStrongPassword(pwd: string): boolean {
    if (!pwd || pwd.length < 12) return false;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSymbol = /[^A-Za-z0-9]/.test(pwd);
    return hasUpper && hasLower && hasNumber && hasSymbol;
  }

  async onModuleInit() {
    const count = await this.userRepo.count();
    if (count === 0) {
      const email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
      let defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || '';
      if (!this.isStrongPassword(defaultPassword)) {
        defaultPassword = crypto.randomBytes(16).toString('hex');
      }
      const pwd = await bcrypt.hash(defaultPassword, 10);
      await this.userRepo.save({
        email,
        passwordHash: pwd,
        role: 'admin',
        mustChangePassword: true,
      });
      this.logger.warn(
        `Default admin created. Email: ${email}. A temporary password was set and is not logged.`,
      );
      this.logger.warn(
        'Set DEFAULT_ADMIN_PASSWORD and run with RESET_ADMIN_PASSWORD=true once to rotate the password, or use the authenticated change-password endpoint.'
      );
    }

    const resetFlag = String(process.env.RESET_ADMIN_PASSWORD || '').toLowerCase();
    const resetRequested = resetFlag === '1' || resetFlag === 'true' || resetFlag === 'yes';
    if (resetRequested) {
      const email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
      const newPassword = process.env.DEFAULT_ADMIN_PASSWORD || '';
      if (!this.isStrongPassword(newPassword)) {
        this.logger.error('RESET_ADMIN_PASSWORD requested but DEFAULT_ADMIN_PASSWORD is weak or missing');
        return;
      }
      const existing = await this.userRepo.findOne({ where: { email } });
      const hash = await bcrypt.hash(newPassword, 10);
      if (existing) {
        existing.passwordHash = hash;
        existing.mustChangePassword = true;
        await this.userRepo.save(existing);
        this.logger.warn(`Admin password reset for ${email}`);
      } else {
        await this.userRepo.save({
          email,
          passwordHash: hash,
          role: 'admin',
          mustChangePassword: true,
        });
        this.logger.warn(`Admin user created with reset for ${email}`);
      }
    }
  }

  async validateUser(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) return null;

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    };
  }

  async login(user: AuthUserSummary) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwt.sign(payload);
    const requirePasswordChange = !!user.mustChangePassword;
    return {
      access_token: token,
      token,
      accessToken: token,
      requirePasswordChange,
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return { success: false, message: 'Current password is incorrect' };
    }
    if (!this.isStrongPassword(newPassword)) {
      return {
        success: false,
        message:
          'Password too weak. Use 12+ chars with upper, lower, number, symbol',
      };
    }
    const hash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hash;
    user.mustChangePassword = false;
    await this.userRepo.save(user);
    return { success: true };
  }
}

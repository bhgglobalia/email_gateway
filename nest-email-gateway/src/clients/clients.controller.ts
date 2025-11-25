import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';

@Controller('clients')
@SkipThrottle()
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private svc: ClientsService) {}
  @Get()
  async all(@Query('skip') skip?: string, @Query('take') take?: string) {
    const s = Number.isFinite(Number(skip)) ? Number(skip) : 0;
    const t = Number.isFinite(Number(take)) ? Number(take) : 100;
    const data = await this.svc.findAll(s, t);
    return { success: true, data };
  }

  @Post()
  async create(@Body() body: CreateClientDto) {
    const data = await this.svc.create(body);
    return { success: true, data };
  }
}

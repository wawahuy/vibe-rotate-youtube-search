import { Controller, Post, Body, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { BruteForceService, getClientIp } from '../common/services/brute-force.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly bruteForce: BruteForceService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin login — returns JWT' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip = getClientIp(req);
    this.bruteForce.check(ip);
    try {
      const result = await this.authService.login(dto.username, dto.password);
      this.bruteForce.success(ip);
      return result;
    } catch (err) {
      this.bruteForce.fail(ip);
      throw err;
    }
  }
}

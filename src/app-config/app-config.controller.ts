import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { AppConfigService } from './app-config.service';

class UpdateConfigDto {
  @IsOptional()
  @IsString()
  youtube_cookies?: string;

  @IsOptional()
  @IsString()
  youtube_proxy?: string;

  @IsOptional()
  @IsString()
  youtube_player_client?: string;
}

@ApiTags('app-config')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('app-config')
export class AppConfigController {
  constructor(private readonly configService: AppConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Get all app config values' })
  async getAll(): Promise<Record<string, string>> {
    return this.configService.getAll();
  }

  @Put()
  @ApiOperation({ summary: 'Update app config values' })
  async update(@Body() dto: UpdateConfigDto): Promise<Record<string, string>> {
    const entries: Record<string, string> = {};
    if (dto.youtube_cookies !== undefined) entries['youtube_cookies'] = dto.youtube_cookies;
    if (dto.youtube_proxy !== undefined) entries['youtube_proxy'] = dto.youtube_proxy;
    if (dto.youtube_player_client !== undefined) entries['youtube_player_client'] = dto.youtube_player_client;
    await this.configService.upsertMany(entries);
    return this.configService.getAll();
  }
}

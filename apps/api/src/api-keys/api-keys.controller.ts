import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto, UpdateApiKeyDto } from './api-keys.dto';

@ApiTags('api-keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/api-keys')
export class ApiKeysController {
  constructor(private apiKeysService: ApiKeysService) {}

  @Get()
  @ApiOperation({ summary: 'List all API keys' })
  findAll(): Promise<any[]> {
    return this.apiKeysService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Add a new API key' })
  create(@Body() dto: CreateApiKeyDto) {
    return this.apiKeysService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update API key' })
  update(@Param('id') id: string, @Body() dto: UpdateApiKeyDto): Promise<any> {
    return this.apiKeysService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete API key' })
  remove(@Param('id') id: string) {
    return this.apiKeysService.remove(id);
  }

  @Post(':id/reset')
  @ApiOperation({ summary: 'Reset exhausted key to active' })
  reset(@Param('id') id: string) {
    return this.apiKeysService.resetStatus(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProviderKeysService } from './provider-keys.service';
import { CreateProviderKeyDto } from './dto/create-provider-key.dto';
import { UpdateProviderKeyDto } from './dto/update-provider-key.dto';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';

@ApiTags('provider-keys')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('provider-keys')
export class ProviderKeysController {
  constructor(private readonly service: ProviderKeysService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new provider API key' })
  async create(@Body() dto: CreateProviderKeyDto) {
    const key = await this.service.create(dto);
    return this.service.sanitize([key])[0];
  }

  @Get()
  @ApiOperation({ summary: 'List all provider keys' })
  @ApiQuery({ name: 'provider', required: false, enum: ['youtube', 'serpapi'] })
  async findAll(@Query('provider') provider?: string) {
    const keys = await this.service.findAll(provider);
    return this.service.sanitize(keys);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single provider key by ID' })
  async findOne(@Param('id') id: string) {
    const key = await this.service.findOne(id);
    return this.service.sanitize([key])[0];
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a provider key' })
  async update(@Param('id') id: string, @Body() dto: UpdateProviderKeyDto) {
    const key = await this.service.update(id, dto);
    return this.service.sanitize([key])[0];
  }

  @Post(':id/reset')
  @ApiOperation({ summary: 'Reset quota and re-activate a key' })
  async reset(@Param('id') id: string) {
    const key = await this.service.resetKey(id);
    return this.service.sanitize([key])[0];
  }

  @Post(':id/disable')
  @ApiOperation({ summary: 'Manually deactivate a provider key' })
  async disable(@Param('id') id: string) {
    const key = await this.service.disableKey(id);
    return this.service.sanitize([key])[0];
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Re-activate a disabled provider key' })
  async activate(@Param('id') id: string) {
    const key = await this.service.activateKey(id);
    return this.service.sanitize([key])[0];
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a provider key' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}

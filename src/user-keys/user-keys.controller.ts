import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserKeysService } from './user-keys.service';
import { CreateUserKeyDto } from './dto/create-user-key.dto';
import { UpdateUserKeyDto } from './dto/update-user-key.dto';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';

@ApiTags('user-keys')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('user-keys')
export class UserKeysController {
  constructor(private readonly service: UserKeysService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user API key' })
  async create(@Body() dto: CreateUserKeyDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all user API keys' })
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user API key by ID' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a user API key' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserKeyDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/disable')
  @ApiOperation({ summary: 'Disable a user API key' })
  async disable(@Param('id') id: string) {
    return this.service.disable(id);
  }

  @Post(':id/enable')
  @ApiOperation({ summary: 'Re-enable a user API key' })
  async enable(@Param('id') id: string) {
    return this.service.enable(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user API key' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}

import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UserKeysService } from './user-keys.service';
import { CreateUserKeyDto, UpdateUserKeyDto } from './user-keys.dto';

@ApiTags('user-keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/user-keys')
export class UserKeysController {
  constructor(private userKeysService: UserKeysService) {}

  @Get()
  @ApiOperation({ summary: 'List all user API keys' })
  findAll() {
    return this.userKeysService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Generate a new user API key' })
  create(@Body() dto: CreateUserKeyDto) {
    return this.userKeysService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user key label/status' })
  update(@Param('id') id: string, @Body() dto: UpdateUserKeyDto) {
    return this.userKeysService.update(id, dto);
  }

  @Post(':id/revoke')
  @ApiOperation({ summary: 'Revoke a user API key' })
  revoke(@Param('id') id: string) {
    return this.userKeysService.revoke(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user API key' })
  remove(@Param('id') id: string) {
    return this.userKeysService.remove(id);
  }
}

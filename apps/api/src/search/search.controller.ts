import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiSecurity } from '@nestjs/swagger';
import { CombinedAuthGuard } from '../common/guards/combined-auth.guard';
import { KeyRotationService } from '../providers/key-rotation.service';

@ApiTags('search')
@ApiSecurity('bearer')
@ApiSecurity('x-api-key')
@UseGuards(CombinedAuthGuard)
@Controller('api/search')
export class SearchController {
  constructor(private keyRotationService: KeyRotationService) {}

  @Get()
  @ApiOperation({ summary: 'Search YouTube videos' })
  @ApiQuery({ name: 'q', required: true })
  async search(@Query('q') query: string) {
    if (!query?.trim()) {
      return { results: [] };
    }
    const results = await this.keyRotationService.search(query.trim());
    return { results };
  }
}

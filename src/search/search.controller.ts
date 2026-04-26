import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { CombinedGuard } from '../common/guards/combined.guard';

@ApiTags('search')
@ApiBearerAuth()
@ApiSecurity('x-api-key')
@UseGuards(CombinedGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search YouTube videos (x-api-key or Bearer JWT)' })
  @ApiQuery({ name: 'q', description: 'Search query', required: true })
  async search(@Query('q') query: string, @Req() req: any) {
    const userApiKeyId = req.userApiKey?._id?.toString() || null;
    return this.searchService.search(query, userApiKeyId);
  }
}

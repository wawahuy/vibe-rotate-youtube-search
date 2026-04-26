import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VideoInfoService } from './video-info.service';
import { ReportService } from '../report/report.service';
import { CombinedGuard } from '../common/guards/combined.guard';

@ApiTags('video-info')
@ApiBearerAuth()
@ApiSecurity('x-api-key')
@UseGuards(CombinedGuard)
@Controller('video-info')
export class VideoInfoController {
  constructor(
    private readonly videoInfoService: VideoInfoService,
    private readonly reportService: ReportService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get video info via yt-dlp (x-api-key or Bearer JWT)' })
  @ApiQuery({ name: 'url', description: 'YouTube video URL', required: true })
  async getInfo(@Query('url') url: string, @Req() req: any) {
    const userApiKeyId = req.userApiKey?._id?.toString() || null;
    try {
      const info = await this.videoInfoService.getVideoInfo(url);
      await this.reportService.createLog({
        endpoint: '/api/video-info',
        providerUsed: 'yt-dlp',
        userApiKeyId,
        status: 'success',
        statusCode: 200,
        query: url,
      });
      return info;
    } catch (err) {
      await this.reportService.createLog({
        endpoint: '/api/video-info',
        providerUsed: 'yt-dlp',
        userApiKeyId,
        status: 'error',
        statusCode: err.status || 500,
        query: url,
        errorMessage: err.message,
      });
      throw err;
    }
  }
}

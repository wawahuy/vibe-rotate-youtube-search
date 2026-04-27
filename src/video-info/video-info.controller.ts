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
    const start = Date.now();
    try {
      const info = await this.videoInfoService.getVideoInfo(url);
      await this.reportService.createLog({
        endpoint: '/api/video-info',
        providerUsed: 'yt-dlp',
        userApiKeyId,
        status: 'success',
        statusCode: 200,
        query: url,
        executionTimeMs: Date.now() - start,
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
        executionTimeMs: Date.now() - start,
      });
      throw err;
    }
  }

  @Get('raw')
  @ApiOperation({ summary: 'Get raw yt-dlp JSON metadata by video ID (x-api-key or Bearer JWT)' })
  @ApiQuery({ name: 'videoId', description: 'YouTube video ID (11 chars)', required: true })
  async getRaw(@Query('videoId') videoId: string, @Req() req: any) {
    const userApiKeyId = req.userApiKey?._id?.toString() || null;
    const start = Date.now();
    try {
      const info = await this.videoInfoService.getRawInfo(videoId);
      await this.reportService.createLog({
        endpoint: '/api/video-info/raw',
        providerUsed: 'yt-dlp',
        userApiKeyId,
        status: 'success',
        statusCode: 200,
        query: videoId,
        executionTimeMs: Date.now() - start,
      });
      return info;
    } catch (err) {
      await this.reportService.createLog({
        endpoint: '/api/video-info/raw',
        providerUsed: 'yt-dlp',
        userApiKeyId,
        status: 'error',
        statusCode: err.status || 500,
        query: videoId,
        errorMessage: err.message,
        executionTimeMs: Date.now() - start,
      });
      throw err;
    }
  }
}

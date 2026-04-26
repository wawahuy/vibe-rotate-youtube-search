import { Controller, Get, Query, BadRequestException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiSecurity } from '@nestjs/swagger';
import { CombinedAuthGuard } from '../common/guards/combined-auth.guard';
import { VideoInfoService } from './video-info.service';

@ApiTags('video-info')
@ApiSecurity('bearer')
@ApiSecurity('x-api-key')
@UseGuards(CombinedAuthGuard)
@Controller('api/video-info')
export class VideoInfoController {
  constructor(private videoInfoService: VideoInfoService) {}

  @Get()
  @ApiOperation({ summary: 'Get video info via yt-dlp' })
  @ApiQuery({ name: 'url', required: true })
  async getVideoInfo(@Query('url') url: string) {
    if (!url?.trim()) {
      throw new BadRequestException('URL is required');
    }
    const ytPattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
    if (!ytPattern.test(url)) {
      throw new BadRequestException('Invalid YouTube URL');
    }
    return this.videoInfoService.getVideoInfo(url);
  }
}

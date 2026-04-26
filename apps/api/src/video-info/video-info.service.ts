import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';
import * as path from 'path';
import axios from 'axios';

export interface VideoInfo {
  title: string;
  duration: string;
  viewCount: number;
  uploader: string;
  thumbnail: string;
}

@Injectable()
export class VideoInfoService {
  private readonly logger = new Logger(VideoInfoService.name);

  constructor(private configService: ConfigService) {}

  async getVideoInfo(url: string): Promise<VideoInfo> {
    try {
      return await this.getFromLocalYtDlp(url);
    } catch (err) {
      this.logger.warn(`Local yt-dlp failed: ${err.message}. Trying remote fallback...`);
      return this.getFromRemoteService(url);
    }
  }

  private getFromLocalYtDlp(url: string): Promise<VideoInfo> {
    return new Promise((resolve, reject) => {
      // Try bundled binary first, then global binary
      const ytdlpPaths = [
        path.join(process.cwd(), 'bin', 'yt-dlp'),
        'yt-dlp',
      ];

      const tryPath = (index: number) => {
        if (index >= ytdlpPaths.length) {
          return reject(new Error('yt-dlp binary not found'));
        }

        const child = spawn(ytdlpPaths[index], ['-J', '--no-playlist', url], {
          timeout: 30000,
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => { stdout += data; });
        child.stderr.on('data', (data) => { stderr += data; });

        child.on('close', (code) => {
          if (code !== 0) {
            return tryPath(index + 1);
          }
          try {
            const json = JSON.parse(stdout);
            resolve({
              title: json.title || '',
              duration: json.duration_string || String(json.duration || 0),
              viewCount: json.view_count || 0,
              uploader: json.uploader || json.channel || '',
              thumbnail: json.thumbnail || '',
            });
          } catch {
            reject(new Error('Failed to parse yt-dlp output'));
          }
        });

        child.on('error', () => tryPath(index + 1));
      };

      tryPath(0);
    });
  }

  private async getFromRemoteService(url: string): Promise<VideoInfo> {
    const remoteUrl = this.configService.get<string>('YTDLP_REMOTE_URL');
    if (!remoteUrl) {
      throw new Error('No yt-dlp remote service configured');
    }
    const res = await axios.get(`${remoteUrl}/info`, { params: { url }, timeout: 30000 });
    return res.data as VideoInfo;
  }
}

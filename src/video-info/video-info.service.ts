import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { spawn, execFile } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import { getYtDlpPath, getYtDlpBaseArgs } from '../common/utils/ytdlp-path.util';
import { AppConfigService } from '../app-config/app-config.service';

const execFileAsync = promisify(execFile);
const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/

export interface VideoInfo {
  title: string;
  duration: number | null;       // seconds
  durationFormatted: string | null;
  viewCount: number | null;
  uploader: string | null;
  thumbnail: string | null;
  description: string | null;
  uploadDate: string | null;
  webpage_url: string | null;
}

@Injectable()
export class VideoInfoService {
  private readonly logger = new Logger(VideoInfoService.name);

  constructor(private readonly appConfigService: AppConfigService) {}

  async getVideoInfo(url: string): Promise<VideoInfo> {
    // Validate URL to prevent injection — must be a valid http/https URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new HttpException('Invalid URL', HttpStatus.BAD_REQUEST);
    }
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new HttpException('Only http/https URLs are supported', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.runYtDlp(url);
    } catch (ytDlpErr) {
      this.logger.warn(`yt-dlp failed for ${url}: ${ytDlpErr.message}. Using fallback.`);
      return this.fallback(url);
    }
  }

  private runYtDlp(url: string): Promise<VideoInfo> {
    return new Promise(async (resolve, reject) => {
      let bin: string;
      let bypassArgs: string[];
      try {
        const cfg = await this.appConfigService.getYtDlpConfig();
        [bin, bypassArgs] = await Promise.all([getYtDlpPath(), getYtDlpBaseArgs(cfg)]);
      } catch (err) {
        reject(err);
        return;
      }
      // Using spawn with args array — no shell interpolation, safe from injection
      const proc = spawn(bin, [...bypassArgs, '--no-playlist', '-J', url], {
        timeout: 30000,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });
      proc.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      proc.on('error', (err) => {
        reject(new Error(`yt-dlp not found or failed to start: ${err.message}`));
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(stderr || `yt-dlp exited with code ${code}`));
          return;
        }
        try {
          const data = JSON.parse(stdout);
          resolve(this.parseYtDlpOutput(data, url));
        } catch (parseErr) {
          reject(new Error(`Failed to parse yt-dlp output: ${parseErr.message}`));
        }
      });
    });
  }

  private parseYtDlpOutput(data: any, url: string): VideoInfo {
    const seconds = data.duration ?? null;
    return {
      title: data.title ?? null,
      duration: seconds,
      durationFormatted: seconds != null ? this.formatDuration(seconds) : null,
      viewCount: data.view_count ?? null,
      uploader: data.uploader ?? data.channel ?? null,
      thumbnail: data.thumbnail ?? null,
      description: data.description ? data.description.slice(0, 500) : null,
      uploadDate: data.upload_date
        ? `${data.upload_date.slice(0, 4)}-${data.upload_date.slice(4, 6)}-${data.upload_date.slice(6, 8)}`
        : null,
      webpage_url: data.webpage_url ?? url,
    };
  }

  /** Fallback: use YouTube oEmbed API (no key required) */
  private async fallback(url: string): Promise<VideoInfo> {
    const videoId = this.extractVideoId(url);
    if (!videoId) {
      throw new HttpException(
        'Cannot extract video info: yt-dlp unavailable and invalid YouTube URL',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    try {
      const { data } = await axios.get(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&format=json`,
        { timeout: 8000 },
      );
      return {
        title: data.title ?? null,
        duration: null,
        durationFormatted: null,
        viewCount: null,
        uploader: data.author_name ?? null,
        thumbnail: data.thumbnail_url ?? null,
        description: null,
        uploadDate: null,
        webpage_url: `https://www.youtube.com/watch?v=${videoId}`,
      };
    } catch (err) {
      throw new HttpException(
        `Fallback oEmbed failed: ${err.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  private extractVideoId(url: string): string | null {
    const patterns = [
      /[?&]v=([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /shorts\/([a-zA-Z0-9_-]{11})/,
      /embed\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  private formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  /**
   * Fetch raw yt-dlp JSON for a YouTube video ID.
   * Returns the full metadata object exactly as yt-dlp outputs it.
   */
  async getRawInfo(videoId: string): Promise<Record<string, any>> {
    return this.fetchYtInfo(videoId);
  }

  private async fetchYtInfo(videoId: string): Promise<Record<string, any>> {
    if (!VIDEO_ID_RE.test(videoId)) {
      throw new HttpException('Invalid video ID', HttpStatus.BAD_REQUEST);
    }
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const cfg = await this.appConfigService.getYtDlpConfig();
    const [bin, bypassArgs] = await Promise.all([getYtDlpPath(), getYtDlpBaseArgs(cfg)]);
    try {
      const { stdout } = await execFileAsync(
        bin,
        [...bypassArgs, '-j', '--no-playlist', '--no-warnings', url],
        { timeout: 30_000 },
      );
      return JSON.parse(stdout) as Record<string, any>;
    } catch (err) {
      throw new HttpException(
        `yt-dlp failed: ${(err as Error).message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}

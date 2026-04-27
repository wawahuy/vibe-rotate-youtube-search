import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppConfig, AppConfigDocument } from './schemas/app-config.schema';

export const CONFIG_KEYS = {
  YOUTUBE_COOKIES: 'youtube_cookies',
  YOUTUBE_PROXY: 'youtube_proxy',
  YOUTUBE_PLAYER_CLIENT: 'youtube_player_client',
} as const;

export type ConfigKey = (typeof CONFIG_KEYS)[keyof typeof CONFIG_KEYS];

export interface YtDlpConfig {
  cookies: string;
  proxy: string;
  playerClient: string;
}

@Injectable()
export class AppConfigService {
  constructor(
    @InjectModel(AppConfig.name)
    private readonly configModel: Model<AppConfigDocument>,
  ) {}

  async get(key: ConfigKey): Promise<string> {
    const doc = await this.configModel.findOne({ key }).exec();
    return doc?.value ?? '';
  }

  async getAll(): Promise<Record<string, string>> {
    const docs = await this.configModel.find().exec();
    const result: Record<string, string> = {};
    for (const doc of docs) {
      result[doc.key] = doc.value;
    }
    return result;
  }

  async upsertMany(entries: Record<string, string>): Promise<void> {
    const ops = Object.entries(entries).map(([key, value]) => ({
      updateOne: {
        filter: { key },
        update: { $set: { key, value } },
        upsert: true,
      },
    }));
    if (ops.length) {
      await this.configModel.bulkWrite(ops);
    }
  }

  /** Returns the yt-dlp relevant config, falling back to env vars when DB value is empty. */
  async getYtDlpConfig(): Promise<YtDlpConfig> {
    const all = await this.getAll();
    return {
      cookies:
        all[CONFIG_KEYS.YOUTUBE_COOKIES] ||
        process.env.YOUTUBE_COOKIES ||
        '',
      proxy:
        all[CONFIG_KEYS.YOUTUBE_PROXY] ||
        process.env.YOUTUBE_PROXY ||
        '',
      playerClient:
        all[CONFIG_KEYS.YOUTUBE_PLAYER_CLIENT] ||
        process.env.YOUTUBE_PLAYER_CLIENT ||
        'ios',
    };
  }
}

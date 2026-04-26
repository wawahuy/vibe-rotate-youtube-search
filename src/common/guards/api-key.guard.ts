import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserApiKey, UserApiKeyDocument } from '../../user-keys/schemas/user-api-key.schema';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @InjectModel(UserApiKey.name)
    private readonly userApiKeyModel: Model<UserApiKeyDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const key = req.headers['x-api-key'] as string;

    if (!key) {
      throw new UnauthorizedException('API key is required');
    }

    const apiKey = await this.userApiKeyModel.findOne({ key }).exec();

    if (!apiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (apiKey.status !== 'active') {
      throw new UnauthorizedException('API key is disabled');
    }

    // Rate limit check
    if (apiKey.rateLimit && apiKey.rateLimit > 0) {
      const now = new Date();
      const resetAt = apiKey.rateLimitResetAt;

      if (!resetAt || resetAt <= now) {
        // Reset window
        await this.userApiKeyModel.findByIdAndUpdate(apiKey._id, {
          $set: {
            rateLimitCount: 1,
            rateLimitResetAt: new Date(now.getTime() + 60 * 60 * 1000),
          },
        });
      } else if (apiKey.rateLimitCount >= apiKey.rateLimit) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Rate limit exceeded. Try again later.',
            resetAt: resetAt,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      } else {
        await this.userApiKeyModel.findByIdAndUpdate(apiKey._id, {
          $inc: { rateLimitCount: 1, usageCount: 1 },
        });
        req.userApiKey = apiKey;
        return true;
      }
    }

    // Atomically increment usage count
    await this.userApiKeyModel.findByIdAndUpdate(apiKey._id, {
      $inc: { usageCount: 1 },
    });

    req.userApiKey = apiKey;
    return true;
  }
}

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserApiKey, UserApiKeyDocument } from '../../user-keys/schemas/user-api-key.schema';
import { BruteForceService, getClientIp } from '../services/brute-force.service';

/**
 * CombinedGuard:
 *  - If x-api-key header present → validate user API key
 *  - Otherwise → validate JWT (admin)
 */
@Injectable()
export class CombinedGuard implements CanActivate {
  constructor(
    @InjectModel(UserApiKey.name)
    private readonly userApiKeyModel: Model<UserApiKeyDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly bruteForce: BruteForceService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const ip = getClientIp(req);
    this.bruteForce.check(ip);

    const apiKeyHeader = req.headers['x-api-key'] as string;
    try {
      const result = apiKeyHeader
        ? await this.validateApiKey(req, apiKeyHeader)
        : this.validateJwt(req);
      this.bruteForce.success(ip);
      return result;
    } catch (err) {
      // Don't count per-key rate-limit (429) as a brute-force failure
      if (err instanceof HttpException && err.getStatus() === HttpStatus.TOO_MANY_REQUESTS) {
        throw err;
      }
      this.bruteForce.fail(ip);
      throw err;
    }
  }

  private async validateApiKey(req: any, key: string): Promise<boolean> {
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
        await this.userApiKeyModel.findByIdAndUpdate(apiKey._id, {
          $set: {
            rateLimitCount: 1,
            rateLimitResetAt: new Date(now.getTime() + 60 * 60 * 1000),
          },
          $inc: { usageCount: 1 },
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
      }
    } else {
      await this.userApiKeyModel.findByIdAndUpdate(apiKey._id, {
        $inc: { usageCount: 1 },
      });
    }

    req.userApiKey = { _id: apiKey._id.toString(), key: apiKey.key, name: apiKey.name };
    return true;
  }

  private validateJwt(req: any): boolean {
    const authHeader = req.headers['authorization'] as string;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication required (x-api-key or Bearer token)');
    }

    const token = authHeader.slice(7);
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET', 'default-secret'),
      });
      req.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

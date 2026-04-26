import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserApiKey, UserApiKeyDocument } from '../../database/user-api-key.schema';

@Injectable()
export class CombinedAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectModel(UserApiKey.name) private userApiKeyModel: Model<UserApiKeyDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Try x-api-key header
    const apiKey = request.headers['x-api-key'];
    if (apiKey) {
      const keyDoc = await this.userApiKeyModel.findOne({ key: apiKey, status: 'active' });
      if (keyDoc) {
        request.user = { type: 'api-key', keyId: keyDoc._id.toString(), label: keyDoc.label };
        return true;
      }
    }

    // 2. Try JWT Bearer token
    const authHeader = request.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const payload = this.jwtService.verify(token, {
          secret: this.configService.get<string>('JWT_SECRET'),
        });
        request.user = payload;
        return true;
      } catch {
        // Invalid JWT — fall through
      }
    }

    throw new UnauthorizedException('Provide a valid Bearer token or x-api-key header');
  }
}

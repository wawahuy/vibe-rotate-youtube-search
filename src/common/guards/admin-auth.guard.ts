import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BruteForceService, getClientIp } from '../services/brute-force.service';

@Injectable()
export class AdminAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly bruteForce: BruteForceService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ip = getClientIp(context.switchToHttp().getRequest());
    this.bruteForce.check(ip);
    try {
      const result = await (super.canActivate(context) as Promise<boolean>);
      this.bruteForce.success(ip);
      return result;
    } catch (err) {
      this.bruteForce.fail(ip);
      throw err;
    }
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Admin authentication required');
    }
    return user;
  }
}

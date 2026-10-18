import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';

@Injectable()
export class AIServiceKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const configuredKey = process.env.AI_SERVICE_API_KEY;
    if (!configuredKey) {
      throw new ServiceUnavailableException(
        'AI service API key is not configured',
      );
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const suppliedKey = request.headers['x-ai-service-key'];
    if (
      typeof suppliedKey !== 'string' ||
      suppliedKey.length !== configuredKey.length ||
      !timingSafeEqual(Buffer.from(suppliedKey), Buffer.from(configuredKey))
    ) {
      throw new UnauthorizedException('Invalid AI service key');
    }

    return true;
  }
}

import {
  ExecutionContext,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { AIServiceKeyGuard } from './ai-service-key.guard';

describe('AIServiceKeyGuard', () => {
  const originalApiKey = process.env.AI_SERVICE_API_KEY;

  afterEach(() => {
    if (originalApiKey === undefined) {
      delete process.env.AI_SERVICE_API_KEY;
    } else {
      process.env.AI_SERVICE_API_KEY = originalApiKey;
    }
  });

  function createContext(apiKey?: string): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { 'x-ai-service-key': apiKey },
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows a request with the configured shared key', () => {
    process.env.AI_SERVICE_API_KEY = 'test-secret';

    expect(new AIServiceKeyGuard().canActivate(createContext('test-secret'))).toBe(
      true,
    );
  });

  it('rejects a request with a missing or incorrect key', () => {
    process.env.AI_SERVICE_API_KEY = 'test-secret';
    const guard = new AIServiceKeyGuard();

    expect(() => guard.canActivate(createContext())).toThrow(
      UnauthorizedException,
    );
    expect(() => guard.canActivate(createContext('wrong-secret'))).toThrow(
      UnauthorizedException,
    );
  });

  it('fails closed when the shared key is not configured', () => {
    delete process.env.AI_SERVICE_API_KEY;

    expect(() => new AIServiceKeyGuard().canActivate(createContext())).toThrow(
      ServiceUnavailableException,
    );
  });
});

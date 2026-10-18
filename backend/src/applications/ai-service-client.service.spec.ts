import { AIServiceClient } from './ai-service-client.service';

describe('AIServiceClient', () => {
  const originalServiceUrl = process.env.AI_SERVICE_URL;
  const originalApiKey = process.env.AI_SERVICE_API_KEY;

  beforeEach(() => {
    process.env.AI_SERVICE_URL = 'https://ai-service.example.com/';
    process.env.AI_SERVICE_API_KEY = 'shared-test-key';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalServiceUrl === undefined) {
      delete process.env.AI_SERVICE_URL;
    } else {
      process.env.AI_SERVICE_URL = originalServiceUrl;
    }
    if (originalApiKey === undefined) {
      delete process.env.AI_SERVICE_API_KEY;
    } else {
      process.env.AI_SERVICE_API_KEY = originalApiKey;
    }
  });

  it('sends review requests to the public HTTP endpoint with the shared key', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Application review started' }),
    } as Response);
    const client = new AIServiceClient();

    await expect(client.processApplicationReview('application/123')).resolves.toEqual({
      message: 'Application review started',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://ai-service.example.com/ai-review/process/application%2F123',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-ai-service-key': 'shared-test-key',
        }),
      }),
    );
  });

  it('fails explicitly if the shared key is missing', async () => {
    delete process.env.AI_SERVICE_API_KEY;
    const fetchMock = jest.spyOn(global, 'fetch');
    const client = new AIServiceClient();

    await expect(client.getReviewStatus('application-123')).rejects.toThrow(
      'AI_SERVICE_API_KEY is not configured',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

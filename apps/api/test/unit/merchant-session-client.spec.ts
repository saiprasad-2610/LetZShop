import { SimplyApiClient } from '@simply/api-contracts';

describe('Merchant session API client', () => {
  const originalFetch = global.fetch;
  let client: SimplyApiClient;
  let fetchMock: jest.Mock;
  const response = (status: number, data: any = {}) =>
    new Response(JSON.stringify(status === 200 ? { success: true, data } : { message: 'Unauthorized' }), { status });

  beforeEach(() => {
    client = new SimplyApiClient('http://localhost:4000');
    client.setToken('expired-access');
    client.setRefreshToken('valid-refresh');
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => { global.fetch = originalFetch; });

  it.each(['auth/me', 'auth/logout', 'seller/dashboard'])('refreshes expired access for %s and retries with the new JWT', async (path) => {
    const refreshed = jest.fn();
    client.setOnTokenRefreshed(refreshed);
    fetchMock.mockResolvedValueOnce(response(401))
      .mockResolvedValueOnce(response(200, { accessToken: 'new-access', refreshToken: 'new-refresh' }))
      .mockResolvedValueOnce(response(200, { ok: true }));
    await expect(client.request(path)).resolves.toEqual({ ok: true });
    expect(fetchMock.mock.calls[1][0]).toBe('http://localhost:4000/auth/session/refresh');
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer new-access');
    expect(refreshed).toHaveBeenCalledWith('new-access', 'new-refresh');
  });

  it('shares one rotating refresh token between concurrent protected requests', async () => {
    let releaseRefresh!: (value: Response) => void;
    let signalRefresh!: () => void;
    const started = new Promise<void>(resolve => { signalRefresh = resolve; });
    fetchMock.mockImplementation((url: string, options: any) => {
      if (url.endsWith('/auth/session/refresh')) {
        signalRefresh();
        return new Promise<Response>(resolve => { releaseRefresh = resolve; });
      }
      return Promise.resolve(response(options.headers.Authorization === 'Bearer new-access' ? 200 : 401, { ok: true }));
    });
    const requests = [client.request('seller/dashboard'), client.request('stores/my-store')];
    await started;
    releaseRefresh(response(200, { accessToken: 'new-access', refreshToken: 'new-refresh' }));
    await expect(Promise.all(requests)).resolves.toEqual([{ ok: true }, { ok: true }]);
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith('/auth/session/refresh'))).toHaveLength(1);
  });

  it('notifies the portal when both access and refresh are rejected', async () => {
    const expired = jest.fn();
    client.setOnSessionExpired(expired);
    fetchMock.mockImplementation(() => Promise.resolve(response(401)));
    await expect(client.request('seller/dashboard')).rejects.toMatchObject({ status: 401 });
    expect(expired).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not attempt refresh or clear the session for an incorrect PIN', async () => {
    const expired = jest.fn();
    client.setOnSessionExpired(expired);
    fetchMock.mockResolvedValue(response(401));
    await expect(client.auth.loginWithPin('+919876543210', '000000')).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(expired).not.toHaveBeenCalled();
  });

  it('does not restore tokens if logout clears them during an in-flight refresh', async () => {
    let release!: (value: Response) => void;
    fetchMock.mockImplementation(() => new Promise<Response>(resolve => { release = resolve; }));
    const refreshed = jest.fn();
    client.setOnTokenRefreshed(refreshed);
    const pending = client.refreshAccessToken();
    client.setToken(null);
    client.setRefreshToken(null);
    release(response(200, { accessToken: 'new-access', refreshToken: 'new-refresh' }));
    await expect(pending).resolves.toBe(false);
    expect(client.getToken()).toBeNull();
    expect(client.getRefreshToken()).toBeNull();
    expect(refreshed).not.toHaveBeenCalled();
  });

  it('sends bodyless logout without a JSON content type that Fastify would reject', async () => {
    fetchMock.mockResolvedValue(response(200, { success: true }));
    await client.auth.logout();
    expect(fetchMock.mock.calls[0][1].headers['Content-Type']).toBeUndefined();
    expect(fetchMock.mock.calls[0][1].body).toBeUndefined();
  });
});

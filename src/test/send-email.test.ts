import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import process from 'node:process';

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

import handler from '../../api/send-email';

const originalApiKey = process.env.RESEND_API_KEY;

function response() {
  const res = {
    setHeader: vi.fn(),
    status: vi.fn(),
    json: vi.fn(),
    end: vi.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
}

describe('send-email API', () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = 'test-key';
    sendMock.mockReset();
  });

  afterAll(() => {
    if (originalApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalApiKey;
  });

  it('returns the provider message ID when Resend accepts the email', async () => {
    sendMock.mockResolvedValue({ data: { id: 'email-123' }, error: null });
    const res = response();

    await handler({ method: 'POST', body: { to: 'client@example.com', subject: 'Quote', html: '<p>Quote</p>' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ id: 'email-123' });
  });

  it('does not report success when Resend returns an error without throwing', async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: 'Domain not verified', statusCode: 403 } });
    const res = response();

    await handler({ method: 'POST', body: { to: 'client@example.com', subject: 'Quote', html: '<p>Quote</p>' } }, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Domain not verified' });
  });

  it('fails clearly when the email key is missing', async () => {
    delete process.env.RESEND_API_KEY;
    const res = response();

    await handler({ method: 'POST', body: { to: 'client@example.com', subject: 'Quote', html: '<p>Quote</p>' } }, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(sendMock).not.toHaveBeenCalled();
  });
});

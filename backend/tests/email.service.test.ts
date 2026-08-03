import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const sendMock = vi.fn();

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: sendMock },
  })),
}));

describe('sendPasswordResetOtpEmail (Resend)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    sendMock.mockReset();
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/test',
      JWT_SECRET: process.env.JWT_SECRET ?? 'test-jwt-secret-min-32-chars-long',
      RESEND_API_KEY: 're_test_key',
      RESEND_FROM: 'Pharma-Exchange <onboarding@resend.dev>',
      OTP_DEV_MODE: 'false',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('sends branded OTP email via Resend', async () => {
    sendMock.mockResolvedValue({ data: { id: 'msg_123' }, error: null });

    const { sendPasswordResetOtpEmail, resetResendClientForTests } = await import('../src/shared/services/email.service');
    resetResendClientForTests();

    await sendPasswordResetOtpEmail('user@example.com', '123456');

    expect(sendMock).toHaveBeenCalledOnce();
    const payload = sendMock.mock.calls[0][0];
    expect(payload.from).toBe('Pharma-Exchange <onboarding@resend.dev>');
    expect(payload.to).toEqual(['user@example.com']);
    expect(payload.subject).toContain('123456');
    expect(payload.html).toContain('123456');
    expect(payload.html).toContain('Pharma-Exchange');
    expect(payload.text).toContain('123456');
    expect(payload.tags).toEqual([{ name: 'category', value: 'password_reset_otp' }]);
  });

  it('throws when Resend returns an error', async () => {
    sendMock.mockResolvedValue({ data: null, error: { name: 'validation_error', message: 'Invalid from' } });

    const { sendPasswordResetOtpEmail, resetResendClientForTests } = await import('../src/shared/services/email.service');
    resetResendClientForTests();

    await expect(sendPasswordResetOtpEmail('user@example.com', '654321')).rejects.toThrow('Failed to send verification email');
  });

  it('skips send when Resend is not configured in test mode', async () => {
    delete process.env.RESEND_API_KEY;
    process.env.OTP_DEV_MODE = 'true';

    const { sendPasswordResetOtpEmail, resetResendClientForTests } = await import('../src/shared/services/email.service');
    resetResendClientForTests();

    await sendPasswordResetOtpEmail('user@example.com', '111111');

    expect(sendMock).not.toHaveBeenCalled();
  });
});

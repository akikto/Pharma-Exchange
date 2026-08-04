import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  Msg91Error,
  normalizeBangladeshPhone,
  sendOtp,
  verifyOtp,
  resendOtp,
} from '../src/shared/services/msg91.service';

describe('msg91 service', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async () => new Response('{}'));
    fetchSpy.mockReset();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('normalizeBangladeshPhone', () => {
    it('accepts +88 prefix, 880 prefix, and local 01 prefix', () => {
      expect(normalizeBangladeshPhone('+8801712345678')).toBe('8801712345678');
      expect(normalizeBangladeshPhone('8801712345678')).toBe('8801712345678');
      expect(normalizeBangladeshPhone('01712345678')).toBe('8801712345678');
      expect(normalizeBangladeshPhone('1712345678')).toBe('8801712345678');
      expect(normalizeBangladeshPhone('008801712345678')).toBe('8801712345678');
    });

    it('rejects invalid Bangladesh numbers', () => {
      expect(() => normalizeBangladeshPhone('12345')).toThrowError(/Invalid Bangladesh/);
      expect(() => normalizeBangladeshPhone('+11234567890')).toThrowError(/Invalid Bangladesh/);
      // Bangladesh mobiles start with 013–019
      expect(() => normalizeBangladeshPhone('8801212345678')).toThrowError(/Invalid Bangladesh/);
    });
  });

  describe('sendOtp', () => {
    it('POSTs to /api/v5/otp with template_id, mobile, sender and authkey header', async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify({ type: 'success', request_id: 'req-1' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );

      const result = await sendOtp('+8801712345678');
      expect(result.requestId).toBe('req-1');

      const [urlArg, initArg] = fetchSpy.mock.calls[0]!;
      const url = new URL(String(urlArg));
      expect(url.origin + url.pathname).toBe('https://control.msg91.com/api/v5/otp');
      expect(url.searchParams.get('mobile')).toBe('8801712345678');
      expect(url.searchParams.get('template_id')).toBe('test-msg91-template-id');
      expect(url.searchParams.get('otp_length')).toBe('6');
      expect(url.searchParams.get('sender')).toBe('MEDLNK');
      expect((initArg as RequestInit).method).toBe('POST');
      const headers = (initArg as RequestInit).headers as Record<string, string>;
      expect(headers.authkey).toBe('test-msg91-auth-key');
    });

    it('maps 429 to OTP_PROVIDER_RATE_LIMIT', async () => {
      fetchSpy.mockResolvedValueOnce(new Response('{}', { status: 429 }));
      await expect(sendOtp('+8801712345678')).rejects.toMatchObject({
        code: 'OTP_PROVIDER_RATE_LIMIT',
      });
    });

    it('maps 401/403 to OTP_PROVIDER_AUTH', async () => {
      fetchSpy.mockResolvedValueOnce(new Response('{}', { status: 401 }));
      await expect(sendOtp('+8801712345678')).rejects.toMatchObject({
        code: 'OTP_PROVIDER_AUTH',
      });
    });

    it('maps 5xx to OTP_PROVIDER_UNAVAILABLE', async () => {
      fetchSpy.mockResolvedValueOnce(new Response('{}', { status: 502 }));
      await expect(sendOtp('+8801712345678')).rejects.toMatchObject({
        code: 'OTP_PROVIDER_UNAVAILABLE',
      });
    });

    it('maps network failures to OTP_PROVIDER_UNAVAILABLE', async () => {
      fetchSpy.mockRejectedValueOnce(new Error('network down'));
      await expect(sendOtp('+8801712345678')).rejects.toBeInstanceOf(Msg91Error);
    });
  });

  describe('verifyOtp', () => {
    it('GETs /verify with mobile and otp query params', async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify({ type: 'success', message: 'OTP verified' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );

      const ok = await verifyOtp('+8801712345678', '123456');
      expect(ok).toBe(true);

      const [urlArg, initArg] = fetchSpy.mock.calls[0]!;
      const url = new URL(String(urlArg));
      expect(url.pathname).toBe('/api/v5/otp/verify');
      expect(url.searchParams.get('mobile')).toBe('8801712345678');
      expect(url.searchParams.get('otp')).toBe('123456');
      expect((initArg as RequestInit).method).toBe('GET');
    });

    it('short-circuits invalid code lengths without calling MSG91', async () => {
      const ok = await verifyOtp('+8801712345678', '12');
      expect(ok).toBe(false);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('returns false when MSG91 responds with a non-success type', async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify({ type: 'error', message: 'wrong otp' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
      await expect(verifyOtp('+8801712345678', '123456')).rejects.toBeInstanceOf(Msg91Error);
    });
  });

  describe('resendOtp', () => {
    it('POSTs to /retry with retrytype=text', async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify({ type: 'success', request_id: 'req-2' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );

      const result = await resendOtp('+8801712345678');
      expect(result.requestId).toBe('req-2');

      const [urlArg, initArg] = fetchSpy.mock.calls[0]!;
      const url = new URL(String(urlArg));
      expect(url.pathname).toBe('/api/v5/otp/retry');
      expect(url.searchParams.get('retrytype')).toBe('text');
      expect((initArg as RequestInit).method).toBe('POST');
    });
  });
});

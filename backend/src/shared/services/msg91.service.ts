/**
 * MSG91 SMS OTP provider client.
 *
 * Production-only OTP delivery/verification. No local OTP generation, no
 * dev-mode logging, no mock fallbacks. See docs/BL-01-MSG91.md for setup.
 *
 * MSG91 REST API:
 *  - POST   {BASE}/          -> send OTP
 *  - GET    {BASE}/verify    -> verify OTP
 *  - POST   {BASE}/retry     -> resend OTP
 * Auth is via the `authkey` request header (never in URLs or logs).
 */
import { env, isMsg91Configured } from '../../config/env';
import { logger } from '../utils/logger';

export class Msg91Error extends Error {
  constructor(
    public status: number,
    public code: string,
    public providerMessage?: string,
  ) {
    super(providerMessage || `MSG91 error (${status})`);
    this.name = 'Msg91Error';
  }
}

export class Msg91ConfigError extends Error {
  code = 'OTP_PROVIDER_UNCONFIGURED';
  constructor() {
    super('MSG91 OTP provider is not configured');
    this.name = 'Msg91ConfigError';
  }
}

interface Msg91Response {
  type?: string;
  message?: string;
  request_id?: string;
  requestId?: string;
  [key: string]: unknown;
}

/**
 * Normalize a Bangladesh phone number into MSG91 international format
 * (`880` + 10-digit local number, no `+`).
 * Accepts inputs like `+8801712345678`, `8801712345678`, `01712345678`.
 */
export function normalizeBangladeshPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  let mobile = digits;
  if (mobile.startsWith('00')) mobile = mobile.slice(2);
  if (mobile.startsWith('0') && !mobile.startsWith('880')) mobile = `880${mobile.slice(1)}`;
  if (mobile.startsWith('1') && mobile.length === 10) mobile = `880${mobile}`;
  if (!/^8801[3-9]\d{8}$/.test(mobile)) {
    throw Object.assign(new Error('Invalid Bangladesh mobile number'), { code: 'INVALID_PHONE' });
  }
  return mobile;
}

function requireConfig(): void {
  if (!isMsg91Configured()) throw new Msg91ConfigError();
}

async function callMsg91(url: URL, init: RequestInit = {}): Promise<Msg91Response> {
  let response: Response;
  try {
    response = await fetch(url.toString(), {
      ...init,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authkey: env.MSG91_AUTH_KEY!,
        ...(init.headers || {}),
      },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    // Do not log URL query (contains mobile) or headers (contain authkey).
    logger.warn(`MSG91 network error: ${(err as Error).message}`);
    throw new Msg91Error(503, 'OTP_PROVIDER_UNAVAILABLE', 'OTP provider unavailable');
  }

  const body = (await response.json().catch(() => null)) as Msg91Response | null;
  if (!response.ok || body?.type === 'error') {
    logger.warn(`MSG91 non-ok response status=${response.status} type=${body?.type ?? 'unknown'}`);
    const code =
      response.status === 429 ? 'OTP_PROVIDER_RATE_LIMIT'
      : response.status === 401 || response.status === 403 ? 'OTP_PROVIDER_AUTH'
      : response.status >= 500 ? 'OTP_PROVIDER_UNAVAILABLE'
      : 'OTP_PROVIDER_ERROR';
    throw new Msg91Error(response.status, code, body?.message);
  }
  return body ?? {};
}

export interface Msg91SendResult {
  requestId?: string;
}

export async function sendOtp(phone: string): Promise<Msg91SendResult> {
  requireConfig();
  const mobile = normalizeBangladeshPhone(phone);
  const url = new URL(env.MSG91_BASE_URL);
  url.search = new URLSearchParams({
    template_id: env.MSG91_TEMPLATE_ID!,
    mobile,
    otp_length: String(env.MSG91_OTP_LENGTH),
    otp_expiry: String(env.OTP_EXPIRY_MINUTES),
    sender: env.MSG91_SENDER_ID!,
  }).toString();

  const result = await callMsg91(url, { method: 'POST', body: '{}' });
  const requestId = String(result.request_id ?? result.requestId ?? '') || undefined;
  return { requestId };
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  requireConfig();
  const mobile = normalizeBangladeshPhone(phone);
  if (!/^\d+$/.test(code) || code.length !== env.MSG91_OTP_LENGTH) return false;
  const url = new URL(`${env.MSG91_BASE_URL}/verify`);
  url.search = new URLSearchParams({ mobile, otp: code }).toString();
  const result = await callMsg91(url, { method: 'GET' });
  return result.type === 'success' || /verified/i.test(String(result.message ?? ''));
}

export async function resendOtp(phone: string): Promise<Msg91SendResult> {
  requireConfig();
  const mobile = normalizeBangladeshPhone(phone);
  const url = new URL(`${env.MSG91_BASE_URL}/retry`);
  url.search = new URLSearchParams({ mobile, retrytype: 'text' }).toString();
  const result = await callMsg91(url, { method: 'POST', body: '{}' });
  const requestId = String(result.request_id ?? result.requestId ?? '') || undefined;
  return { requestId };
}

export const msg91 = { sendOtp, verifyOtp, resendOtp, normalizeBangladeshPhone };

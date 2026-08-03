import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env, isSmtpConfigured } from '../../config/env';
import { logger } from '../utils/logger';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!isSmtpConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

function buildOtpEmailHtml(code: string, expiryMinutes: number): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f4f3;font-family:Inter,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8e6;">
    <tr>
      <td style="background:#0F766E;padding:24px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Pharma-Exchange</h1>
        <p style="margin:8px 0 0;color:#E6F4F2;font-size:13px;">B2B Pharmacy Marketplace</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 28px;">
        <h2 style="margin:0 0 8px;color:#0F1B19;font-size:18px;">Your verification code</h2>
        <p style="margin:0 0 24px;color:#4B5D5A;font-size:14px;line-height:1.5;">
          Use this one-time code to reset your password. It expires in <strong>${expiryMinutes} minutes</strong>.
        </p>
        <div style="background:#E6F4F2;border-radius:10px;padding:20px;text-align:center;margin-bottom:24px;">
          <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#0F766E;font-family:monospace;">${code}</span>
        </div>
        <p style="margin:0;color:#96A6A3;font-size:12px;line-height:1.5;">
          If you did not request this code, you can safely ignore this email. Never share this code with anyone.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 28px;background:#f8faf9;border-top:1px solid #e2e8e6;">
        <p style="margin:0;color:#96A6A3;font-size:11px;text-align:center;">&copy; ${new Date().getFullYear()} Pharma-Exchange. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendPasswordResetOtpEmail(to: string, code: string): Promise<void> {
  const expiryMinutes = env.EMAIL_OTP_EXPIRY_MINUTES;
  const subject = `${code} is your Pharma-Exchange password reset code`;
  const html = buildOtpEmailHtml(code, expiryMinutes);
  const text = `Your Pharma-Exchange password reset code is ${code}. It expires in ${expiryMinutes} minutes. If you did not request this, ignore this email.`;

  const transport = getTransporter();

  if (!transport) {
    if (env.OTP_DEV_MODE || env.NODE_ENV === 'test') {
      logger.info('[DEV EMAIL] Password reset OTP sent', { to: maskEmail(to) });
      return;
    }
    logger.error('SMTP not configured — cannot send password reset OTP', { to: maskEmail(to) });
    throw new Error('Email service unavailable');
  }

  await transport.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    text,
    html,
  });

  logger.info('Password reset OTP email sent', { to: maskEmail(to) });
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const masked = local.length <= 2 ? '**' : `${local[0]}***${local[local.length - 1]}`;
  return `${masked}@${domain}`;
}

import nodemailer from 'nodemailer';
import { env } from '../../config/env';

export class EmailConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailConfigError';
  }
}

export class EmailDeliveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailDeliveryError';
  }
}

function createTransport() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.MAIL_FROM) {
    throw new EmailConfigError('SMTP is not configured');
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

export function isEmailConfigured(): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.MAIL_FROM);
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const transport = createTransport();

  try {
    await transport.sendMail({
      from: env.MAIL_FROM,
      to,
      subject: 'Reset your Pharma Exchange password',
      text: [
        'You requested a password reset for your Pharma Exchange account.',
        '',
        `Reset your password: ${resetUrl}`,
        '',
        'This link expires in 15 minutes. If you did not request this, you can ignore this email.',
      ].join('\n'),
      html: `
        <p>You requested a password reset for your Pharma Exchange account.</p>
        <p><a href="${resetUrl}">Reset your password</a></p>
        <p>This link expires in 15 minutes. If you did not request this, you can ignore this email.</p>
      `,
    });
  } catch (err) {
    throw new EmailDeliveryError(err instanceof Error ? err.message : 'Failed to send email');
  }
}

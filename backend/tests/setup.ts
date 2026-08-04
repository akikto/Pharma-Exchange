process.env.NODE_ENV ??= 'test';
process.env.DATABASE_URL ??= 'postgresql://medlink:medlink@localhost:5432/medlink_b2b?schema=public';
process.env.JWT_SECRET ??= 'test-jwt-secret-min-32-chars-long';

// MSG91 test configuration. Tests mock global.fetch so no real HTTP is made.
process.env.MSG91_ENABLED ??= 'true';
process.env.MSG91_AUTH_KEY ??= 'test-msg91-auth-key';
process.env.MSG91_SENDER_ID ??= 'MEDLNK';
process.env.MSG91_TEMPLATE_ID ??= 'test-msg91-template-id';
process.env.MSG91_OTP_LENGTH ??= '6';
process.env.MSG91_BASE_URL ??= 'https://control.msg91.com/api/v5/otp';

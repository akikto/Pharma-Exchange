process.env.NODE_ENV ??= 'test';
process.env.DATABASE_URL ??= 'postgresql://medlink:medlink@localhost:5432/medlink_b2b?schema=public';
process.env.JWT_SECRET ??= 'test-jwt-secret-min-32-chars-long';
process.env.OTP_DEV_MODE ??= 'true';

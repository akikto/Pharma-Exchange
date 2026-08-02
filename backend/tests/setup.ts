process.env.NODE_ENV ??= 'test';
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/pharma_test';
process.env.JWT_SECRET ??= 'test-jwt-secret-min-32-chars-long';
process.env.OTP_DEV_MODE ??= 'true';

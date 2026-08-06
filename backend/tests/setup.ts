process.env.NODE_ENV ??= 'test';
process.env.DATABASE_URL ??= 'postgresql://medlink:medlink@localhost:5432/medlink_b2b?schema=public';
process.env.JWT_SECRET ??= 'test-jwt-secret-min-32-chars-long';

// SMTP test configuration — email service is mocked in auth tests.
process.env.SMTP_HOST ??= 'smtp.gmail.com';
process.env.SMTP_PORT ??= '587';
process.env.SMTP_SECURE ??= 'false';
process.env.SMTP_USER ??= 'test@gmail.com';
process.env.SMTP_PASS ??= 'test-app-password';
process.env.MAIL_FROM ??= 'Pharma Exchange <test@gmail.com>';

// Razorpay test configuration (BL-02). Tests mock the SDK / crypto layer;
// no real HTTP is made.
process.env.RAZORPAY_ENABLED ??= 'true';
process.env.RAZORPAY_KEY_ID ??= 'rzp_test_ci_key';
process.env.RAZORPAY_KEY_SECRET ??= 'ci-razorpay-key-secret';
process.env.RAZORPAY_WEBHOOK_SECRET ??= 'ci-razorpay-webhook-secret';
process.env.RAZORPAY_CURRENCY ??= 'INR';

// BL-09: generous limits in test/CI — rate limiters also skip when NODE_ENV=test.
process.env.RATE_LIMIT_MAX ??= '10000';

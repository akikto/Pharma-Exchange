## SMTP (password reset) — dev/test

CI and local tests mock the email service — no real SMTP is required.

For manual password-reset testing against staging, configure:

- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_SECURE=false`
- `SMTP_USER=<your-gmail-address>`
- `SMTP_PASS=<gmail-app-password>`
- `MAIL_FROM="Pharma Exchange <your-gmail-address>"`

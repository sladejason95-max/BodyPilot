# BodyPilot Live API

This is the provider-neutral backend shell BodyPilot needs before a serious launch. It gives the app concrete endpoints for health checks, transactional email, checkout, payment webhooks, background jobs, and privacy deletion.

## Run Locally

```bash
cp .env.example .env
npm run live:api
```

The API listens on `http://127.0.0.1:8787` by default.

## Endpoints

- `GET /api/health` reports connector readiness and missing production secrets.
- `POST /api/email/send` sends through Resend or Postmark when configured, otherwise console-queues in local mode.
- `POST /api/payments/checkout` creates Stripe subscription checkout when Stripe keys and price IDs are present, otherwise returns a local demo checkout URL.
- `POST /api/webhooks/stripe` verifies Stripe signatures when `STRIPE_WEBHOOK_SECRET` exists and queues entitlement refresh jobs.
- `POST /api/jobs/enqueue`, `POST /api/jobs/next`, `POST /api/jobs/complete`, and `GET /api/jobs` provide a local job queue contract.
- `POST /api/privacy/delete` queues account deletion across auth, database, storage, billing entitlements, and email lists.

## Production Notes

Local/demo behavior is intentionally blocked in production mode. Set `BODYPILOT_ENV=production` only after real provider secrets are present.

For iOS digital subscriptions, plan on server-verified StoreKit receipts or App Store Server Notifications. Stripe checkout is useful for web or eligible external-service flows, but subscription entitlement should still be resolved by the backend before unlocking pro or coach features.

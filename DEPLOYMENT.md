# Deployment Checklist

## Backend environment

Set these before running the API in production:

```env
NODE_ENV=production
PORT=8080
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=use_a_long_random_secret
JWT_EXPIRE=7d
REQUIRE_EMAIL_VERIFICATION=false
FRONTEND_URL=https://your-frontend-domain.com
CORS_ORIGINS=https://your-frontend-domain.com
BASE_URL=https://your-backend-domain.com
TRUST_PROXY=1
UPLOAD_MAX_FILE_SIZE_MB=100
CLOUDINARY_URL=
CLOUDINARY_FOLDER=chapel-system
```

Do not set `MONGODB_TLS_ALLOW_INVALID_CERTS=true` in production. The backend will fail startup if that unsafe diagnostic flag is enabled with `NODE_ENV=production`.

For managed MongoDB setup, backups, first admin creation, and `/api/ready` checks, see `DATABASE_SETUP.md`.

Optional integrations:

```env
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=Chapel Management
PAYMENT_CALLBACK_SECRET=
MTN_API_URL=
MTN_API_KEY=
AIRTEL_API_URL=
AIRTEL_API_KEY=
DONATION_PAYMENT_PROVIDER=relworx
RELWORX_API_BASE_URL=https://payments.relworx.com/api
RELWORX_API_KEY=
RELWORX_ACCOUNT_NO=
RELWORX_WEBHOOK_KEY=
PESAPAL_ENVIRONMENT=sandbox
PESAPAL_CONSUMER_KEY=
PESAPAL_CONSUMER_SECRET=
PESAPAL_IPN_ID=
PESAPAL_CALLBACK_URL=https://your-backend-domain.com/api/donations/callback
PESAPAL_CANCELLATION_URL=https://your-frontend-domain.com/donations
```

Pesapal API 3.0 requires a registered IPN URL before checkout links can be created. Register your public callback URL in Pesapal, then set the returned `PESAPAL_IPN_ID`. The backend verifies the final payment status by querying Pesapal with the returned order tracking ID.

When `RELWORX_API_KEY` and `RELWORX_ACCOUNT_NO` are set, donations use Relworx direct mobile money prompts before falling back to Pesapal. In the Relworx dashboard, set the business account webhook URL to `https://your-backend-domain.com/api/donations/callback` so completed or failed prompt statuses update the donation record.

You can register the IPN URL from the backend folder after setting `PESAPAL_CONSUMER_KEY`, `PESAPAL_CONSUMER_SECRET`, and `PESAPAL_CALLBACK_URL`:

```bash
npm run pesapal:register-ipn
```

For production uploads and sermon media, set either `CLOUDINARY_URL` or the three-part Cloudinary config (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`). Production startup fails if Cloudinary is missing, so uploaded media cannot silently fall back to ephemeral `backend/uploads`. Sermon audio and video are stored as Cloudinary media/video resources.

## Frontend environment

```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

## First admin

Set these temporarily in the backend environment:

```env
ADMIN_EMAIL=managementchapel98@gmail.com
ADMIN_PASSWORD=replace_with_a_strong_password
ADMIN_FIRST_NAME=System
ADMIN_LAST_NAME=Admin
ADMIN_PHONE=0000000000
```

Then run:

```bash
npm run create-admin
```

Remove or rotate the admin bootstrap values after the admin account is created.

## Health checks

- `GET /api/health` confirms the API process is running.
- `GET /api/ready` returns `200` only when MongoDB is connected.

Use `/api/ready` for deployment readiness checks.

## Commands

Backend:

```bash
npm ci --omit=dev
npm start
```

Frontend:

```bash
npm ci
npm run build
```

## Before launch

- Run backend tests: `npm test`
- Run frontend build: `npm run build`
- Confirm HTTPS on frontend and backend.
- Confirm `CORS_ORIGINS` contains only trusted frontend domains.
- Confirm `.env` files are not committed.
- Confirm MongoDB backups are enabled.
- Confirm uploads are persistent or move them to cloud storage.
- Confirm payment gateway is either configured or clearly treated as manual/pending.
- Keep `REQUIRE_EMAIL_VERIFICATION=false` until email sending is configured.

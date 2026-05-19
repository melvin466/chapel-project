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
UPLOAD_MAX_FILE_SIZE_MB=25
CLOUDINARY_URL=
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
```

For production uploads, set either `CLOUDINARY_URL` or the three-part Cloudinary config (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`). If none are set, uploads fall back to local `backend/uploads`, which is only safe with persistent storage.

## Frontend environment

```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

## First admin

Set these temporarily in the backend environment:

```env
ADMIN_EMAIL=admin@example.com
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

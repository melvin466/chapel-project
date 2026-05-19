# Database Setup

Use this checklist to connect the Chapel Management System to MongoDB Atlas or another managed MongoDB provider.

## 1. Create The Database

In MongoDB Atlas:

1. Create a project for the chapel system.
2. Create a production cluster.
3. Create a database user with a strong password.
4. Allow your backend host IP address in Network Access.
5. Copy the application connection string.

Use a database name such as:

```text
chapel-system
```

Your production URI should look like:

```text
mongodb+srv://chapel_user:<password>@<cluster-host>/chapel-system?retryWrites=true&w=majority
```

## 2. Configure Backend Environment

Set these backend environment variables in your hosting platform:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://chapel_user:<password>@<cluster-host>/chapel-system?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_long_random_secret
FRONTEND_URL=https://your-frontend-domain.com
CORS_ORIGINS=https://your-frontend-domain.com
BASE_URL=https://your-backend-domain.com
TRUST_PROXY=1
```

Do not set `MONGODB_TLS_ALLOW_INVALID_CERTS` on the deployed backend. The server now refuses to start in production if that value is `true`, because production must validate Atlas TLS certificates normally.

Keep `.env` files out of git. `backend/.gitignore` already ignores them.

## 3. Enable Backups

In Atlas, enable scheduled backups for the production cluster. At minimum, confirm:

- Backups are enabled.
- Retention is long enough for your school/church policy.
- A restore test is documented before launch.

## 4. Create The First Admin

Temporarily set these environment variables:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace_with_a_strong_password
ADMIN_FIRST_NAME=System
ADMIN_LAST_NAME=Admin
ADMIN_PHONE=0000000000
```

Then run from `backend`:

```bash
npm run create-admin
```

Remove or rotate the admin bootstrap values after the admin account is created.

## 5. Test Readiness

After deploying the backend, test:

```bash
curl https://your-backend-domain.com/api/health
curl https://your-backend-domain.com/api/ready
```

Expected `/api/ready` response when MongoDB is connected:

```json
{
  "status": "ready",
  "database": "connected"
}
```

If `/api/ready` returns `503`, check the MongoDB URI, database user password, Atlas IP access list, and backend logs.

## Local TLS Troubleshooting

If local testing reaches Atlas but fails with an SSL/TLS certificate error, first update Node.js to the current LTS release and confirm the Windows certificate store is up to date.

For a short local diagnostic only, the backend supports:

```env
MONGODB_TLS=true
MONGODB_TLS_ALLOW_INVALID_CERTS=true
```

Do not use `MONGODB_TLS_ALLOW_INVALID_CERTS=true` in production. Production should validate Atlas certificates normally.

# Authentication API

Apply `prisma/migrations/20261104151500_create_auth_tables/migration.sql` to the configured MySQL database before starting the API. Then run `npm start`.

All endpoints use JSON. Passwords must be 8–128 characters; emails are normalized to lowercase.

## 1. Register

`POST /v1/auth/register`

```bash
curl -X POST http://localhost:5000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada","email":"ada@example.com","password":"a-strong-password"}'
```

Returns `201` when the account is created. Email addresses must be unique. Log in to get a token.

## 2. Log in

`POST /v1/auth/login`

```bash
curl -X POST http://localhost:5000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","password":"a-strong-password"}'
```

Returns the user and a token. Tokens expire after seven days.

## 3. Log out

`POST /v1/auth/logout`

Use the token returned by registration or login:

```bash
curl -X POST http://localhost:5000/v1/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Logging out revokes that token. Log in again to get a new one.

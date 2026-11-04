# Organizations and projects API

Apply the auth migration and then `prisma/migrations/20261104155200_create_organizations_and_projects/migration.sql` before using these endpoints. All endpoints require a bearer token from `POST /v1/auth/login`.

## Create an organization

`POST /v1/organizations`

```json
{ "name": "Acme" }
```

The logged-in user is added as the organization owner.

## List your organizations

`GET /v1/organizations`

Returns only organizations the logged-in user belongs to.

## Create a project

`POST /v1/projects`

```json
{ "organizationId": 1, "name": "Email worker" }
```

The user must belong to the organization.

## List your projects

`GET /v1/projects`

Returns projects belonging to organizations the logged-in user belongs to.

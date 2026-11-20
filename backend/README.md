# Homie backend

FastAPI backend in the shared Homie repository. Run the commands below from `backend/`. Backend CI lives at `../.github/workflows/backend.yml`; dependencies and runtime remain independent of the mobile app.

## Local development

```sh
cp .env.example .env
uv sync --frozen
uv run alembic upgrade head
uv run python -m app.seed
uv run uvicorn app.main:app --reload
# Separate terminal:
uv run python -m app.worker
```

The seed and fixed local token are development fixtures only. Current functionality: scoped inventory, explicit model confirmation and durable research jobs. Live discovery is not implemented; the worker records `unavailable` rather than claiming a manual was found.

## Checks and contract

```sh
uv run ruff check .
uv run ruff format --check .
uv run mypy app
uv run pytest
uv run alembic check
uv run python export_contract.py
```

Commit `openapi.json` together with `../mobile/contracts/openapi.json` and regenerated mobile types; CI verifies the contract and publishes an artifact. SQLite supports local checks; CI also checks migrations against PostgreSQL.

## Railway

Connect `Ankit-Mehra/homie` to Railway with service root directory `/backend`. For an existing service using config-as-code, set its config file path to `/backend/railway.toml` (relative to the repository root). `Dockerfile` builds from this directory only; `railway.toml` runs Alembic before deploying the API, checks `/ready`, and the image listens on Railway's `PORT`.

Required service variables:

- `ENVIRONMENT=production`
- `DEV_AUTH=false`
- `DATABASE_URL=postgresql+psycopg://...` (Supabase PostgreSQL connection, including SSL options appropriate to your connection)
- `SUPABASE_URL=https://YOUR_PROJECT.supabase.co`

Generate a Railway HTTPS domain for the API. Set its URL as mobile's `EXPO_PUBLIC_API_URL`.

Create a second Railway service from the same repository for the worker. Set its root directory to `/backend` and its existing config-as-code file path to `/backend/railway.worker.toml`; use the same environment/database settings. Deploy API migrations successfully before starting/updating the worker. No HTTP domain or healthcheck is needed for this process. The worker currently only marks discovery unavailable.

See [Railway monorepo setup](https://docs.railway.com/deployments/monorepo) for service root and config paths. Railway has deprecated [config-as-code](https://docs.railway.com/config-as-code); existing TOML configurations require migration before its December 1, 2026 cutoff. New services should use Railway service settings or Infrastructure as Code. Hosting has not been performed or verified. Authentication validates Supabase JWTs and supports single-household onboarding. Live account-flow verification remains required. Do not interpret deploy configuration as beta readiness.

Alembic is the sole schema owner. RLS denies direct client access; backend authorization still scopes every operation. Prefer forward migrations after real data exists. `alembic downgrade base` deletes initial tables and is only for disposable local databases. Backup/restore verification remains a beta gate.

## Account onboarding

The mobile app signs in with Supabase and sends its access token to the API.
`GET /v1/me` returns the authenticated user's household (or null).
`POST /v1/me/household` creates a private household once; retries return the same
membership. Clients never choose their user ID, household ID, or role.

For self-hosted Supabase:

- Set `SUPABASE_URL` to the public Envoy URL (not Studio).
- For asymmetric RS256/ES256 signing, leave `SUPABASE_JWT_SECRET` empty. The API
  obtains public keys from `/auth/v1/.well-known/jwks.json`.
- For legacy HS256 signing, set backend-only `SUPABASE_JWT_SECRET` to the same
  secret used by GoTrue (`GOTRUE_JWT_SECRET`). Use Railway variable references;
  never put this secret in mobile `EXPO_PUBLIC_*` variables.
- The expected issuer defaults to `SUPABASE_URL/auth/v1`. If GoTrue uses a
  different issuer, set `SUPABASE_JWT_ISSUER` to its exact configured issuer.
- Keep `ENVIRONMENT=production` and `DEV_AUTH=false` in Railway.

Deploy this version before testing mobile onboarding. `/ready` tests database
connectivity; it does not validate Supabase signing settings or email delivery.

# Homie backend

Independent FastAPI repository. This directory is the repository root; its `.github/` runs backend-only CI. No mobile checkout is required.

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

Commit `openapi.json`; CI verifies it and publishes a contract artifact for the separately versioned mobile repository. SQLite supports local checks; CI also checks migrations against PostgreSQL.

## Railway

Connect this repository to Railway with repository root `/`. `Dockerfile` builds from this directory only; `railway.toml` runs Alembic before deploying the API, checks `/ready`, and the image listens on Railway's `PORT`.

Required service variables:

- `ENVIRONMENT=production`
- `DEV_AUTH=false`
- `DATABASE_URL=postgresql+psycopg://...` (Supabase PostgreSQL connection, including SSL options appropriate to your connection)
- `SUPABASE_URL=https://YOUR_PROJECT.supabase.co`

Generate a Railway HTTPS domain for the API. Set its URL as mobile's `EXPO_PUBLIC_API_URL`.

Create a second Railway service from the same repository for the worker. Set its config file path to `/railway.worker.toml`; use the same environment/database settings. Deploy API migrations successfully before starting/updating the worker. No HTTP domain or healthcheck is needed for this process. The worker currently only marks discovery unavailable.

Deployment config follows [Railway config-as-code](https://docs.railway.com/config-as-code/reference). Hosting has not been performed or verified. Authentication validates Supabase JWTs but onboarding/membership provisioning remain unfinished. Do not interpret deploy configuration as beta readiness.

Alembic is the sole schema owner. RLS denies direct client access; backend authorization still scopes every operation. Prefer forward migrations after real data exists. `alembic downgrade base` deletes initial tables and is only for disposable local databases. Backup/restore verification remains a beta gate.

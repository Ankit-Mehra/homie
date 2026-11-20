# Homie

Household care app. Browser web client + FastAPI backend, with the original Expo / React Native client retained in `mobile/` during the transition: [Ankit-Mehra/homie](https://github.com/Ankit-Mehra/homie).

Open the repository root or `homie.code-workspace` in VS Code. `backend/` and `mobile/` share Git history and root `.github/workflows/`, while keeping their own dependencies, lockfiles and deployment configuration. Run Git commands from this root or either application directory. See [backend setup / Railway](backend/README.md) and [mobile setup / app stores](mobile/README.md).

## Current milestone

Implemented: household-scoped inventory API, typed item entry, optional ownership fields in the API, explicit model confirmation, paginated inventory, persistent idempotent discovery requests, a separate worker, and a browser home / inventory / add / detail experience. The original native client remains available while the web client becomes the offline-compatible development surface. TypeScript API types are generated from FastAPI OpenAPI.

This is a **foundation preview, not the accepted working prototype**. The worker reports `unavailable`: it does not search, retrieve, verify, or invent manuals. Photo identification, live discovery, grounded conversations, schedule approval, confirmed service history, email-code onboarding, and push delivery remain to be implemented. No paid provider calls occur.

## Run locally

Python 3.12+ (tested on 3.13), pip, Node 22+, npm. `uv` remains supported for the locked workflow but is optional in the offline workspace.

```sh
cd backend
cp .env.example .env
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements-dev.txt
python -m alembic upgrade head
python -m app.seed
python -m uvicorn app.main:app --reload --host 0.0.0.0
```

In a second terminal, run the durable worker if you are exercising research jobs:

```sh
cd backend
python -m app.worker
```

The legacy native client remains available from a third terminal:

```sh
cd mobile
cp .env.example .env
npm ci
npm start
```

For the browser app, open `http://localhost:8000/` after starting FastAPI. The web client is served by the backend and uses the local SQLite database by default; it does not need Expo, a simulator, or a separate frontend server. See [web/README.md](web/README.md).

The legacy mobile client uses an Expo SDK 57-compatible development client or Expo Go. iOS simulator uses localhost; Android emulator uses `http://10.0.2.2:8000`. For a physical device, set `EXPO_PUBLIC_API_URL` to your computer's LAN IP. The browser client is the recommended offline development surface.

Local authentication is an explicit development-only fixture. `DEV_AUTH=true` accepts a fixed local token, only with `ENVIRONMENT=development`; it must never be used in a deployed environment. The browser client can also use Supabase email/password auth when configured. Production authentication validates Supabase asymmetric JWTs and requires a pre-existing membership.

## Checks and contract generation

The pip-compatible local commands are:

```sh
cd backend
python -m ruff check .
python -m ruff format --check .
python -m mypy app
python -m pytest
python -m alembic check
python export_contract.py
cd ../mobile
cp ../backend/openapi.json contracts/openapi.json
npm run generate:api
npm run typecheck
npm run lint
npm run format
npm test
```

When `uv` is available, the equivalent locked commands use `uv run` as shown
in the CI workflow.

Commit `backend/openapi.json`, its snapshot at `mobile/contracts/openapi.json`, and regenerated `mobile/src/api/schema.ts` together when changing the API contract. CI checks that the snapshots match and verifies generated files for drift. Dependency resolution is locked in uv.lock and package-lock.json.

## Persistence and deployment boundary

Alembic is the sole schema migration owner. SQLite is a local convenience; configure `DATABASE_URL=postgresql+psycopg://...` for Supabase PostgreSQL. All tables have RLS enabled on PostgreSQL and intentionally have no direct-client policies: the backend alone accesses them with a server database role. Backend household authorization remains mandatory. Do not expose privileged database credentials to mobile.

Run `alembic upgrade head` before starting API/worker processes. Railway can run the backend and worker as separate services using the same database. Deployment has not been performed or verified. To reverse the initial migration in disposable development databases, `alembic downgrade base` destroys all tables; back up data first. Prefer forward migrations once real data exists. Backup/restore and beta privacy policies are not yet validated.

## Next milestones

1. Supabase email-code onboarding, secure session storage, household provisioning and runtime response validation.
2. Bounded OpenAI identification and discovery adapters, safe document retrieval, provenance and exact-model verification, shared budget reservations, real-device evaluation. No uploads required for the acceptance journey.
3. Grounded conversation flow and photo attachments; maintenance proposal review and explicit history confirmation.
4. Resolve scheduling policy; reminders, device QA, end-to-end tests and beta operational gates.

See [specification.md](specification.md) for the full acceptance criteria. Local automated checks do not substitute for browser acceptance, production authentication, or PostgreSQL integration verification.

### Known verification limits

Initial npm audit: 10 moderate findings through Expo's `xcode → uuid` build-tool dependency chain; zero high/critical findings. No forced major upgrades applied. Reassess and resolve before distribution. PostgreSQL migration checks are configured in CI; local verification used SQLite. Native device rendering, performance and release builds have not yet been verified.

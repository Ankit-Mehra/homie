# Homie

Homie is a local-first household care app. The current development surface is
a browser client served by a FastAPI backend, with SQLite for local persistence.
The original Expo / React Native client remains in `mobile/` as a transition
client for a future native release.

## Current status

This repository is a foundation preview, not the accepted production prototype.
The current implementation includes:

- household-scoped inventory APIs;
- item creation, pagination, and explicit model confirmation;
- durable, idempotent research jobs and a separate worker process;
- a browser home, inventory, add-item, and item-detail experience;
- OpenAPI contract generation for the transition mobile client.

The research worker currently reports `unavailable`. It does not search for,
retrieve, verify, or invent manuals. Photo identification, live discovery,
grounded conversations, maintenance scheduling, confirmed service history,
email-code onboarding, and push delivery are still planned. No paid provider
calls are made by the current foundation.


## Repository layout

```text
backend/   FastAPI API, migrations, seed data, and research worker
web/       Dependency-free browser client served by FastAPI
mobile/    Legacy/transition Expo and React Native client
```

The browser client is served from the same origin as the API. This keeps local
development simple and avoids a separate frontend build or CORS configuration.

## Run the browser app locally

Requirements: Python 3.12 or newer and pip. Node/npm are only needed for the
transition mobile client.

From the repository root:

```sh
cd backend
cp .env.example .env
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements-dev.txt
python -m alembic upgrade head
python -m app.seed
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open <http://127.0.0.1:8000/> in the desktop browser. The API serves the
browser client from `web/` and creates the local SQLite database at
`backend/homie.db`.

To exercise the durable research worker, use a second terminal:

```sh
cd backend
. .venv/bin/activate
python -m app.worker
```

The worker is optional for the browser inventory flow and currently records
research as unavailable until a real provider pipeline is implemented.

## Local configuration and authentication

The default `backend/.env.example` is suitable for offline development:

```dotenv
DATABASE_URL=sqlite:///./homie.db
ENVIRONMENT=development
DEV_AUTH=true
SUPABASE_URL=
```

`DEV_AUTH=true` enables the fixed local development token only when
`ENVIRONMENT=development`. It must never be enabled in a deployed environment.
The `.env` files are ignored by Git and must not be committed.

The browser client can use Supabase email/password authentication when a
deployed instance is configured. Only a public Supabase URL and anon/publishable
key belong in [`web/config.js`](web/config.js); never put a service-role key,
JWT signing secret, or database credential in the browser client.

More backend deployment and authentication details are in
[`backend/README.md`](backend/README.md). The browser-specific notes are in
[`web/README.md`](web/README.md).

## Optional transition mobile client

The native client is retained for API compatibility and future distribution.
It requires an Expo-compatible development environment and is not needed for
the desktop browser workflow:

```sh
cd mobile
cp .env.example .env
npm ci
npm start
```

Native iOS/Android rendering, device permissions, release builds, and app-store
submission are not supported by the browser-only desktop environment.

## Checks and API contract

Run backend checks from `backend/` after activating `.venv`:

```sh
python -m ruff check .
python -m ruff format --check .
python -m mypy app
python -m pytest
python -m alembic check
python export_contract.py
```

The browser client does not require generated frontend types or a separate
frontend test command. The transition native client has independent contract
generation and test instructions in [`mobile/README.md`](mobile/README.md); run
those only when deliberately maintaining the native client in a
native-capable environment. They are not required for the offline browser
workflow.

The repository also supports the locked `uv` workflow when `uv` is available.
The pip workflow above is the intended path for the offline desktop workspace.

## Persistence and deployment boundary

SQLite is the local development database. PostgreSQL remains the deployment and
integration-test option, configured with a `postgresql+psycopg://` URL. Alembic
is the sole schema migration owner. The backend enforces household authorization;
privileged database credentials are never exposed to browser or mobile clients.

The API and worker can be deployed as separate Railway services with a shared
PostgreSQL database, but deployment has not been performed or verified. See
[`backend/README.md`](backend/README.md) for the deployment boundary.

## Security and repository hygiene

The root and application-level ignore rules exclude local environment files,
SQLite databases, virtual environments, caches, Expo output, coverage data,
and `node_modules`. Keep credentials in local environment files or deployment
secret stores; do not commit them to the repository.

See [`specification.md`](specification.md) for the full acceptance criteria and
[`DECISIONS.md`](DECISIONS.md) for the recorded product and architecture
decisions.

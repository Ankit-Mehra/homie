# Homie web client

The browser client is intentionally dependency-free. FastAPI serves this directory at `/`, so local development only needs the backend environment and a browser.

```sh
cd backend
uv run alembic upgrade head
uv run python -m app.seed
uv run uvicorn app.main:app --reload
```

Open <http://localhost:8000/>. The default `web/config.js` enables the backend's fixed development token on localhost. The backend must be running with `ENVIRONMENT=development` and `DEV_AUTH=true` for local mode.

For a deployed Supabase-backed instance, set `devAuth` to `false` and provide the public Supabase URL and anon/publishable key in `config.js`. Never put a service-role key or JWT signing secret in this file.

The API defaults to SQLite at `backend/homie.db`. PostgreSQL remains available as a deployment/integration-test option, but the browser prototype does not require a separate database server.

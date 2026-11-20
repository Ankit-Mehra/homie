from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy import text
from starlette.exceptions import HTTPException

from app.db import engine
from app.identity.routes import router as identity
from app.inventory.routes import router as inventory
from app.research.routes import router as research

app = FastAPI(title="Homie API", version="0.1.0")
app.include_router(identity)
app.include_router(inventory)
app.include_router(research)


@app.exception_handler(HTTPException)
async def http_error(request: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": {
                    401: "unauthenticated",
                    403: "forbidden",
                    404: "not_found",
                    409: "conflict",
                }.get(exc.status_code, "request_error"),
                "message": str(exc.detail),
                "request_id": str(uuid4()),
            }
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "validation_error",
                "message": "Check the supplied fields",
                "request_id": str(uuid4()),
            }
        },
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/ready")
def ready() -> dict[str, str]:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return {"status": "ready"}

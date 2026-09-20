from app.config import settings
from app.db import SessionLocal
from app.identity.models import Membership


def main() -> None:
    if not settings.dev_auth or settings.environment != "development":
        raise RuntimeError("Local seed requires DEV_AUTH=true and ENVIRONMENT=development")
    with SessionLocal.begin() as db:
        if db.get(Membership, "local-user") is None:
            db.add(Membership(user_id="local-user", household_id="local-household", role="owner"))


if __name__ == "__main__":
    main()

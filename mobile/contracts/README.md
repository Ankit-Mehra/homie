# API contract snapshot

`openapi.json` is a versioned snapshot exported by the backend, not a manually maintained schema. The mobile app builds using this snapshot in the shared repository.

To update: export `openapi.json` in the backend, copy it here (or download the backend CI `openapi` artifact), then run `npm run generate:api`. Review and commit the snapshot and generated types together. Commit the backend export, this snapshot, and generated types together.

Independent releases require additive API changes while older mobile versions are supported. CI verifies generation against the snapshot and checks that it matches `backend/openapi.json`.

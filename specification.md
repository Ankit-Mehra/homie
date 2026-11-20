# Household support app specification

Last updated: 2026-09-18
Status: Product scope and engineering standards are defined for starting the offline prototype foundation. Connected discovery integration and public-beta details remain optional/open; this is not yet a complete implementation specification.

This document develops the decisions recorded in [DECISIONS.md](DECISIONS.md). Requirements marked confirmed reflect agreed product choices. Proposed details and open questions are not final commitments. Continue updating this document as design decisions are made.

## 1. Product goals and release scope — confirmed

Help households catalog durable possessions, troubleshoot problems using local manuals and reference material, and maintain those possessions through approved schedules and in-app reminders. Connected deployments may add online sources and hosted AI later.

- Launch a browser app for the offline-compatible prototype; installable iOS and Android clients remain a later distribution target.
- Initial audience: Canada and the US; English interface.
- Catalog any durable item, with detailed support initially focused on household appliances, tools, and electronics. Expanded support for vehicles and other categories comes later.
- Prioritize troubleshooting, supported by inventory and maintenance history.
- Optional connected beta with capped AI usage and waitlist admissions in batches; no billing initially.
- Total monthly operating budget: US$100 across all users for optional hosting, data/storage, AI, search, and transactional email. Excludes development time and app-store registration.

## 2. Screens and user journeys

### Confirmed home experience

The home screen is a household overview showing upcoming maintenance, recent items, and a prominent **Ask for help** action. Inventory and conversations should be readily accessible. Exact navigation and visual design remain open.

### Confirmed troubleshooting journey

1. Start with a problem from the household overview, or ask for help from a saved item.
2. Select an existing item or enter a new one through typed brand/model details or a model-label photo. In offline mode, confirm the typed model; prior inventory entry is not required.
3. Clarify symptoms through targeted conversational questions.
4. Offer a brief explanation and a few relevant checks at a time, sourced from local manuals or reference material in offline mode.
5. Adapt subsequent questions and checks to the user's reported results and recorded maintenance history.

Users can attach text and photos of parts, damage, or error displays. In offline mode, store photos for review without automatic visual conclusions. Treat any future visual interpretations as tentative and request confirmation where needed. Audio and video analysis are outside the offline prototype scope.

When a user reports completed maintenance in chat, propose the work and completion date and save it to service history only after user confirmation. Conversation closure and linking the entry to a scheduled task remain open.

### Confirmed item entry

- Support typed brand/model details and model-label photos.
- Require user confirmation of model details before relying on them for model-specific guidance. Offline mode uses typed details and user confirmation; automatic photo identification is optional future functionality.
- Allow optional local manual uploads.
- Ground offline answers only in user-uploaded manuals, bundled local reference material, and structured local data. Online manual discovery and retrieval are optional connected-mode capabilities, not prerequisites for desktop acceptance.
- In connected mode, begin with official guidance discovery and expand research when a question requires other sources.
- Support name, brand/model, category, room, photos, and manuals, plus optional serial number, purchase date, warranty expiry, and receipt.
- Required versus optional core fields and incomplete-identification behavior remain open.

### Confirmed maintenance review

- Present proposed tasks, supporting sources, and intervals for review and adjustment.
- Activate reminders only after the user approves the schedule.
- When the last completion date is unknown, ask for a last service date or a chosen first due date. Keep the task unscheduled until the user chooses.
- Provide in-app tasks and reminders offline. Push notifications require a connected deployment; no maintenance email reminders initially.
- Assign each task to one reminder recipient, defaulting to the person activating the task. Allow reassignment and keep the task visible to everyone in-app.
- Task completion, recurrence calculation, snoozing, reminder timing, and handling recipient departure remain open.

## 3. Functional requirements

### Identity and households — confirmed

- Offline desktop mode uses the development-only local fixture authentication; connected deployments may authenticate using a one-time email code.
- Offline desktop mode uses one local household. Connected deployments may support owner and member roles.
- Both connected-mode roles can manage items and maintenance; only the owner manages membership and deletes the household.
- Share inventory, troubleshooting history, and maintenance tasks within a connected household. Cross-device sharing is not required for offline desktop acceptance.
- Invitation, owner departure/transfer, and account-deletion flows remain open.

### Sources and answer quality — confirmed

- Offline desktop mode anchors model-specific maintenance and safety guidance in local manuals, bundled reference material, and structured local data.
- Connected deployments may supplement local material with manufacturer manuals, official guidance, blogs, and public community sources; guaranteed Reddit integration is not required.
- Cite available source metadata and distinguish official instructions, community experiences, and possible explanations.
- If an exact-model manual is missing locally, explain the limitation and provide clearly labeled general checks. Withhold instructions requiring exact-model verification.
- Do not conduct online research in offline mode or claim that a source was retrieved when it was not.
- Detailed connected retrieval, conflict resolution, source freshness, model/region matching, and unsafe-request handling remain open.

## 4. Data and architecture

### Confirmed stack

| Layer | Choice |
| --- | --- |
| Web client | Dependency-free browser client served by FastAPI |
| Mobile client | React Native, Expo, TypeScript (transition/legacy client) |
| API | Python, FastAPI |
| LLM provider | Optional connected-mode OpenAI API; not required for offline acceptance |
| API and background hosting | Local FastAPI and worker for development; Railway is an optional deployment target |
| Local database | SQLite via SQLAlchemy/Alembic |
| Deployment database | Optional Supabase PostgreSQL |
| Authentication and file storage | Local fixture and local storage in offline mode; optional Supabase in connected mode |
| Supporting public pages, if needed | Vercel |
| Distribution | Apple App Store and Google Play |

### Engineering baseline

- One modular backend with separately running background workers.
- Background processing for local document extraction and reminder preparation. Online discovery is only for connected deployments.
- An API contract connecting the Python backend and TypeScript client.
- Reuse verified public model research across households; keep household uploads, photos, conversations, and service history private to their household.
- Verify performance on iOS and lower-end Android devices.

Section 9 defines required engineering boundaries and quality controls. Concrete database schemas, endpoint payloads, job technology, retention/deletion behavior, offline behavior, and deployment tooling remain to be specified. Exact OpenAI models and search/retrieval integration are optional connected-mode decisions.

## 5. Cost controls and beta operation

### Confirmed

- Admit waitlisted users in batches based on measured operating costs.
- Cap AI usage; exact allowances are unresolved.
- Use official-manual-first research and expand only as needed.
- Treat US$100/month as a planning ceiling, not a validated estimate or a promised user capacity.

### Open

- Fixed hosting allocation and available variable AI/search budget.
- Initial admission batch size and per-user or per-household quotas.
- Provider pricing, request limits, spending alerts, and behavior when budgets are exhausted.
- Waitlist intake, admission operations, and whether supporting public pages are required.
- Observability, support, backups, and recovery procedures.

## 6. Acceptance scenarios

These scenarios derive from confirmed requirements. They are specification criteria, not tests that have been implemented or run.

| Scenario | Expected behavior |
| --- | --- |
| Open the app after onboarding | Show the household overview with upcoming maintenance, recent items, and Ask for help. |
| Start help without an inventory item | Allow problem entry and identify/confirm the item during the conversation. |
| Add a model-label photo | Store the photo and request typed model details and user confirmation before model-specific guidance in offline mode. |
| Report a noisy vacuum | Ask targeted questions and provide a few checks from available local material at a time, adapting to reported results. |
| Attach a troubleshooting photo | Accept and store the photo without presenting automatic visual conclusions as established facts in offline mode. |
| Exact manual unavailable | Explain the gap, offer limited general checks, and withhold instructions requiring exact-model verification. |
| Suggest maintenance | Show tasks, intervals, and sources for review; in-app reminders remain inactive until approval. |
| Last maintenance date unknown | Ask for a last service date or first due date; leave the task unscheduled without a choice. |
| Member manages household items | Permit item and maintenance management; restrict membership management and household deletion to the owner. |
| User reports completed maintenance in chat | Propose the work and date; save history only after confirmation. |
| Activate a maintenance task | Default its reminder recipient to the activating member; allow reassignment and show the task to all members. |
| Add ownership records | Allow optional serial number, purchase date, warranty expiry, and receipt. |
| Maintenance information is available | Use it when responding to subsequent troubleshooting questions. |

Section 9 defines required authorization, retry, notification, and AI evaluation scenarios. Numeric performance targets and a curated model-specific evaluation dataset remain open.

## 7. Confirmed decisions — complete

Status: All three recommended approaches were accepted. No further decision is needed for this section.

- **Item details:** Core details plus optional ownership records: serial number, purchase date, warranty expiry, and receipt.
- **Maintenance from chat:** Propose completed work and its date, then require confirmation before saving history.
- **Reminder recipients:** One assigned member, defaulting to the person activating the task; allow reassignment and show tasks to everyone in-app.

These are requirements for implementation, not pending proposals. The separate details in section 8 do not reopen these choices.

## 8. Prototype readiness and remaining decisions

There is enough product detail to design the offline core prototype journey. Typed model confirmation, local reference material, cited troubleshooting, maintenance review, and confirmed history are required for desktop acceptance. Automatic device identification, online manual discovery, hosted AI, push notifications, and multi-device household sync are optional connected-mode capabilities. Prototype readiness does not establish readiness for a public beta.

### First working prototype — required core journey

- Build in the agreed browser-first stack and keep the API independent of the client runtime.
- Cover household overview, inventory/item details, add-item flow, conversational troubleshooting with source displays, schedule review, and confirmed maintenance-history recording.
- Accept a device photo or typed details, ask for missing identifying information, and confirm the model with the user. Offline acceptance uses typed details and confirmation rather than automatic image identification.
- Use a user-uploaded manual, bundled local reference material, or structured local data for grounded troubleshooting with source references.
- Do not claim that online documentation or an AI provider was consulted in offline mode. If local material is missing, explain the gap and provide only the previously agreed limited general help.
- Demonstrate one complete offline journey with local reference material: identify and confirm an item, ask about a problem, review suggested maintenance, and confirm completed work.
- Online discovery, hosted OpenAI answers, automatic visual identification, push-notification delivery, and multi-device household sharing remain optional connected-mode capabilities.
- Exact connected-mode model/tool choices and integration sequencing remain to be finalized.

### Remaining decisions for live services and beta

1. Required item fields, incomplete model identification, conversation closure, and scheduled-task/history linkage.
2. Reminder timing, recurrence, snoozing, and recipient departure.
3. Onboarding, household lifecycle, privacy, deletion, and offline behavior.
4. Optional connected-mode OpenAI model selection, search/retrieval integration, retrieval behavior, safety boundaries, and a measured cost model.
5. Data/API contracts, operational requirements, acceptance thresholds, and implementation milestones.


## 9. Software engineering requirements

These requirements apply from the first prototype feature to both backend and mobile code. They implement the requested maintainability, modularity, scalability, DRY, and testability standards. They are project requirements, not claims that code or tests already exist.

### 9.1 Structure and dependency boundaries

- Use one repository with `backend/` and `web/` folders in one VS Code workspace, a documented local setup, and independently runnable checks. Keep `mobile/` as a transition client while the browser prototype is the primary development surface. Start with a modular backend and separate worker process; introduce microservices only for a measured need.
- Organize by product capability: identity/households, inventory, device research, conversations, maintenance, and notifications. Keep module ownership explicit and avoid circular imports.
- Each module owns its business rules and persistence operations. Cross-module interaction uses explicit service interfaces rather than reaching into another module's private implementation.
- Keep shared code small: configuration, authentication context, logging, errors, and genuinely reused primitives. Avoid a growing miscellaneous utilities module.
- Apply single responsibility, composition, explicit dependencies, and separation of concerns. Keep business rules independent of transport and external vendor SDKs.
- Apply DRY to business rules, contracts, and stable repeated behavior. Do not force unrelated features into generic abstractions merely because their current code looks similar. Prefer the simplest design supporting confirmed requirements.

### 9.2 FastAPI backend

- Give each capability an APIRouter and module-local request/response schemas, application services, and persistence code. The application entry point assembles dependencies, middleware, and routers rather than containing feature logic.
- Routes validate input, obtain authenticated context, call services, and map results/errors. Domain decisions belong in services; SQL and vendor calls do not belong in route handlers.
- Inject database sessions, provider adapters, clock, and job submission dependencies so tests can replace external boundaries. Do not introduce an interface for every trivial class.
- Use typed Python and Pydantic validation at boundaries. Keep database entities distinct from public response schemas to avoid leaking internal or sensitive fields.
- Isolate optional connected-mode OpenAI, search, document fetching/parsing, storage, email, and push integrations behind narrow adapters. Validate external responses before acting on them.
- Use explicit transaction boundaries for related writes, database constraints for invariants, and version-controlled migrations. Choose one migration owner/tool before creating the first schema; do not maintain competing migration histories.
- Run durable discovery, document processing, and notification work through persisted jobs. Process restarts must not silently lose accepted work. Return job status rather than holding a request open for an entire discovery run.
- Use timeouts, bounded retries with backoff, and idempotency for retried jobs and mutations. Avoid blocking network calls or CPU-heavy parsing on the async event loop.
- Expose versioned business APIs under `/v1`, documented through OpenAPI. Use a consistent error contract with machine-readable code, safe message, and request ID. Define concrete endpoint contracts with each feature before implementation.

### 9.3 Browser frontend

- Use semantic HTML, responsive CSS, and accessible browser interactions. Organize feature modules with their views, API access, state coordination, and tests.
- Separate rendering from business workflows and network calls. Keep API calls in small client functions and let views compose loading, success, and error states.
- Use a single typed API client or generated contract for server-facing TypeScript code. Do not independently hand-maintain duplicate server request/response types. Validate untrusted external data at boundaries where generated types offer no runtime protection.
- Keep server state/cache separate from local UI state. Clear household-sensitive caches and browser sessions on sign-out or membership changes.
- Build shared accessible UI primitives and design tokens for spacing, colors, typography, and feedback. Support keyboard navigation, screen readers, visible focus states, responsive layouts, and reduced motion.
- Every asynchronous flow handles loading, empty, success, error, retry, and loss of connectivity. Prevent accidental duplicate submissions and never show unsaved or failed work as completed.
- Paginate growing lists and conversations, resize images appropriately, cancel obsolete requests, and measure browser performance before optimizing.
- Keep the transition mobile client under `mobile/` aligned with the same API contract until native distribution is explicitly resumed.

### 9.4 Data isolation, security, and agent boundaries

- Verify authentication and household membership on every protected operation. Derive authorization from validated server context, not a client-supplied household ID alone.
- For connected deployments, enable and test RLS for exposed Supabase tables and storage policies for private objects. Service credentials and privileged database connections can bypass RLS: backend and worker authorization must remain explicit and independently tested.
- When connected services are enabled, keep OpenAI keys and privileged Supabase credentials on the server. Use secure mobile token storage, validated environment configuration, and separate development/test/production resources. Commit example variable names, never secret values.
- Keep household files private with scoped, short-lived access links. Do not share uploaded manuals, photos, chats, or maintenance records through the public model-research cache.
- Treat web pages, PDFs, images, and model output as untrusted data, never executable instructions. Tool permissions and household authorization must not be alterable by retrieved text.
- Bound each agent run by tool-call count, duration, document size, token allowance, and cost. Validate tool arguments and require the already-agreed user approvals for schedules and maintenance records.
- Protect server fetchers against SSRF: permit only intended HTTP(S) destinations, block private/local/metadata addresses, and revalidate redirects and resolved destinations. Enforce content-type, size, timeout, and parser resource limits.
- Store source provenance: URL, retrieval time, model/region applicability, document identity/version where available, and cited page or section. A generated answer must not invent evidence of retrieval or a matching manual.
- Redact tokens and personal content from logs. Define retention, deletion, third-party data handling, and backup expiry before accepting public beta data.

### 9.5 Testing from the start

- Set up test runners and CI with the initial scaffolding. Ship tests with each meaningful behavior, not as a final project phase. Add a regression test for fixed behavioral defects where practical.
- Backend: pytest for business rules and service behavior; API tests through FastAPI's test client or HTTPX; local tests use SQLite, while connected/deployment CI may use isolated PostgreSQL/Supabase-compatible resources for migrations, queries, constraints, transactions, and authorization.
- Frontend: browser tests with Playwright in the coding workspace plus focused unit tests for user-visible behavior, forms, accessibility, error states, and async flows. Mock network boundaries rather than internal implementation details.
- Add contract checks for OpenAPI/client drift and browser end-to-end flows. If native distribution resumes, restore the mobile-specific Maestro, camera, notification, and deep-link checks before release.
- Use deterministic local fixtures and fake providers in routine CI. Keep connected OpenAI/search smoke tests opt-in with explicit cost limits; a live-provider test must not run automatically on every pull request.
- Maintain AI/retrieval evaluations for exact-model matches, ambiguous labels, regional variants, missing manuals, conflicting sources, grounded citations, image uncertainty, malicious document instructions, and unsafe repair requests. Combine deterministic assertions with reviewed reference cases; do not rely solely on an LLM judge.
- Required negative tests include cross-household access to records/files/jobs/chats, member attempts at owner-only actions, expired authentication, malformed files, blocked fetch destinations, provider timeouts/rate limits, exhausted budgets, duplicate job delivery, and interrupted processing.
- Required workflow tests include approval before schedule activation, confirmation before history writes, date/time-zone boundaries, no duplicate reminders, and maintaining recorded outcomes after retries. Specify exact date/recurrence policies before implementing those tests.
- Measure coverage to reveal gaps, but do not use a percentage as proof of correctness or add tests that only restate implementation. Every critical authorization, financial-limit, and user-confirmation invariant needs explicit tests.

### 9.6 CI, maintainability, and definition of done

- Backend checks: Ruff lint/format validation, a configured Python type checker, pytest, and migration checks. Frontend checks: ESLint, formatting validation, TypeScript checking, and Jest. Pin compatible tool versions and commit dependency lockfiles.
- CI checks contracts, scans for committed secrets and dependency vulnerabilities, and runs database integration tests. Run mobile end-to-end tests for affected release flows and before distributing a release; keep ordinary feedback loops fast.
- Document local startup, environment variables, test commands, migration procedure, and deployment/rollback. Record consequential architecture decisions with rationale; comments explain non-obvious reasons rather than narrating code.
- A feature is done when its behavior matches acceptance criteria, relevant positive/negative tests pass, loading/failure states work, household access is enforced, telemetry is present where needed, and documentation/contracts are updated.
- Keep changes focused and reviewable. Do not suppress type/lint/test failures globally to pass CI; scope and explain necessary exceptions.

### 9.7 Scalability, reliability, and observability

- Keep API instances stateless; store authoritative records and job state durably. Separate API and worker scaling, using measured demand rather than deploying extra infrastructure upfront.
- Use connection pooling, query indexes driven by access patterns, pagination, and bounded worker concurrency. Avoid unbounded fan-out or repeated document extraction for the same verified public source.
- Record request/job correlation IDs, API latency, queue age, provider errors, token/search usage, and estimated cost without logging raw household content by default.
- Reserve/check usage allowance before paid work, reconcile actual usage afterward, and enforce shared limits atomically across workers. Budget exhaustion must stop additional paid research while retaining access to existing inventory and history.
- Monitor actual provider bills as well as application estimates; application limits alone cannot guarantee an exact total monthly invoice. Set concrete cost allocations and reserves before live usage.
- Provide health/readiness checks, bounded retry recovery, failed-job inspection, and a documented backup/restore procedure. Test a restore before public beta; do not describe an untested backup configuration as verified recovery.
- Keep deployments compatible with browser clients that may be cached or updated independently. Use additive API/schema changes where possible and test migrations and rollback or forward-recovery paths.

### Engineering references

These sources inform framework integration; the project requirements above include our own architecture choices.

- [FastAPI testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [Expo testing with Jest and React Native Testing Library](https://docs.expo.dev/develop/unit-testing/)
- [Supabase row-level security and privileged-access behavior](https://supabase.com/docs/guides/database/postgres/row-level-security)

## 10. Readiness audit

The core product direction is sufficient to start repository scaffolding, module boundaries, test infrastructure, and screen development. It is not yet sufficient to claim a complete working prototype or launch-ready beta. A foundation implementation now exists in `backend/` and `web/`, with inventory/isolation tests and a browser smoke test. The offline journey is the primary acceptance path; live discovery and connected services remain optional and unimplemented. See README.md for exact implementation and verification status.

| Stage | What must be settled or verified |
| --- | --- |
| Before optional connected discovery | Exact OpenAI models/tools, search and fetching approach, PDF/HTML extraction, model-match evidence, failure behavior, bounded agent execution, API keys, and a small real-device source evaluation. |
| Before first persisted feature | Initial schema, migrations, API contracts, household authorization, file access, and isolated test resources. |
| Before scheduling/reminder implementation | Recurrence basis, first-date rules already agreed, completion linkage, time zone, snoozing, recipient departure, and notification scope for the prototype. |
| Before prototype acceptance | Real text/photo identification and automatic manual retrieval without a mandatory upload; cited troubleshooting; reviewed maintenance; confirmed history writes; passing feature and isolation tests on both platforms. |
| Before public beta | Account/household deletion and ownership transfer, invitations, retention and privacy disclosures, recovery verification, real-device notifications, app-store readiness, waitlist operations, and measured capacity/quotas within the US$100 budget. |

The backend/module/test architecture can be chosen under these engineering requirements without another product questionnaire. Product-policy choices still open above should be resolved before their dependent features are implemented. Do not treat deferred launch work as removed from scope.

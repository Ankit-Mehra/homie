# Product decisions

Last updated: 2026-09-18
Status: Product direction, technology stack, and initial beta behavior agreed; detailed implementation planning remains open.

## Product vision

A household inventory and support assistant for the durable items someone owns: appliances, tools, devices, and eventually vehicles and other non-perishable items with user manuals.

Users identify their items, get answers grounded in manuals and local reference
material, and track maintenance, repairs, and reminders. A connected deployment
may add online sources and hosted AI later, but those services are not required
for the offline desktop prototype.

Example: A user enters the model of a Shark vacuum, optionally provides a local
manual, and reports that it has become noisy. The assistant asks relevant
follow-up questions and provides cited checks only from available local
material. If no applicable source is available, it explains the gap and gives
limited, clearly labeled general guidance. Maintenance history informs future
answers and reminders.

## Agreed first release

- Optional connected public beta with capped AI usage. No billing integration initially; limits are still to be defined.
- Launch audience: Canada and the US, with an English interface.
- Browser app first for the offline-compatible prototype. Installable iOS and Android clients remain a later distribution target.
- Broad inventory: users can catalog any durable item. Detailed troubleshooting and maintenance support initially focus on household appliances, tools, and electronics. Broader category support, including vehicles, comes later.
- Troubleshooting is the strongest initial experience, supported by inventory and preventive maintenance features.
- Users can ask for help from a saved item or start with a problem and enter and confirm a new item's details during the conversation. Adding an inventory item first is not required.
- Add items through typed brand/model details or a model-label photo. In offline mode, the photo is stored for review and the user confirms the typed model; automatic visual identification is not required. Users can upload a local manual for grounded guidance.
- Item details include name, brand/model, category, room, photos, and manuals, plus optional serial number, purchase date, warranty expiry, and receipt.
- Home shows a household overview with upcoming maintenance, recent items, and Ask for help. Troubleshooting uses conversational steps and accepts text and photos; offline visual interpretation, audio analysis, and video analysis are deferred.
- Offline desktop mode supports one local household in SQLite. A connected deployment may support authenticated members sharing inventory, troubleshooting history, and maintenance tasks across devices.
- Maintenance schedules, completion history, and in-app reminders work offline. Push notifications require a connected deployment; email reminders are outside the initial scope.

## Beta access and operating budget

- Total operating budget: US$100 per month for the whole app across all users, not per user.
- This budget covers optional connected-mode hosting, database and file storage, AI requests, web search, and transactional email. It excludes development time and app-store registration fees.
- Anyone can register interest through a waitlist; admit users in small batches as measured costs allow.
- Exact user counts, per-user allowances, spending controls, and behavior when limits are reached remain to be defined. The budget is a planning ceiling, not a validated cost estimate.

## Sign-in and shared households

- Offline desktop mode uses the development-only local fixture authentication; it does not require email or a network connection.
- Connected deployments may use one-time email-code authentication.
- Offline desktop mode uses one local household. Connected deployments may support owner and member roles, with members sharing inventory, troubleshooting history, and maintenance tasks.
- Everyone can manage items and maintenance in connected mode; only the owner manages membership or deletes the household. Invitation and ownership-transfer details remain open.

## Maintenance schedule approval

- Show proposed tasks, supporting sources, and intervals for user review and adjustment.
- Activate reminders only after the user approves the proposed schedule; do not activate them automatically on item addition.
- When the last completion date is unknown, ask during review for the last service date or a chosen first due date. Leave the task unscheduled until the user chooses; do not assume maintenance starts today.

- When completed maintenance is mentioned in chat, propose the work and completion date and save only after user confirmation.
- Each task has one assigned reminder recipient, defaulting to the person activating it. Allow reassignment and keep tasks visible to all household members.

## Sources and answer behavior

- Offline desktop mode grounds device-specific maintenance and safety guidance in user-uploaded manuals, bundled local reference material, and structured local data. It must not claim to have searched the internet.
- A connected deployment may use manufacturer manuals, official guidance, and other public sources through an optional retrieval pipeline. Live discovery is not an offline prototype requirement.
- Manual upload is a supported offline path for exact-model guidance. If no applicable local manual is available, explain the gap and offer only clearly labeled general checks.
- Provide source citations when local material includes page, section, or document metadata, and distinguish official instructions from community experiences and possible explanations.
- Establish and confirm the device model before presenting model-specific instructions; in offline mode this is based on typed details and user confirmation.
- Account for recorded maintenance when troubleshooting or suggesting future work.
- Source availability is not guaranteed. Detailed connected retrieval, conflict handling, and boundaries for unsupported or unsafe instructions remain to be designed.

## Agreed technology and hosting

| Component | Decision |
| --- | --- |
| Browser app | Dependency-free browser client served by the FastAPI backend |
| Mobile apps | React Native with Expo and TypeScript; transition client retained under `mobile/` |
| Backend | Python with FastAPI; no C# backend |
| LLM provider | Optional connected-mode OpenAI API; not required for the offline prototype |
| API and background processing | Local FastAPI and worker for development; Railway is an optional deployment target |
| Local database | SQLite via SQLAlchemy/Alembic |
| Deployment database | Optional Supabase-hosted PostgreSQL |
| Authentication and file storage | Local fixture and filesystem/database in offline mode; optional Supabase in connected mode |
| Supporting public pages | Vercel only if needed for privacy, support, account deletion, or other supporting pages |
| Mobile distribution | Apple App Store and Google Play |

Supabase remains a possible connected deployment for combined database,
authentication, and storage. It is not a prerequisite for local browser
development. PostgreSQL and Supabase are not competing database engines:
Supabase hosts PostgreSQL. Any hosted-service pricing and requirements remain
deployment decisions rather than desktop acceptance criteria.

Maintainability, scalability, browser performance, eventual mobile performance, and controlled operating costs are priorities. The principal has experience with Python, C#, Terraform, and Azure, but selected Railway and Vercel instead of Azure hosting. Infrastructure-as-code tooling has not yet been selected for this stack.

## Engineering requirements

- Apply feature-based module separation in FastAPI and the browser client, with thin routes/views, explicit service boundaries, typed contracts, and small reusable components.
- Establish backend/frontend testing and CI from initial scaffolding; include integration, household-isolation, contract, and core browser journey tests.
- Follow the detailed maintainability, DRY, security, reliability, and definition-of-done requirements in specification.md section 9.
- Start with one modular backend and separately running background workers rather than microservices.
- Run local document processing and reminder preparation outside interactive API requests. Run online manual discovery only in connected deployments.
- Use an API contract to keep the Python backend and browser client aligned; keep the transition mobile client compatible with the same contract.
- Verify browser performance first; restore cross-platform mobile performance checks if native distribution resumes.
- Reuse verified public research in connected mode for the same device model across households to reduce costs, while keeping household photos, uploaded files, chats, and maintenance history private to that household. Offline mode uses only local material. Detailed cache and access-control design remains open.

## Open decisions for the next session

- Detailed onboarding, inventory, chat, maintenance, and household-sharing flows.
- Optional connected-mode OpenAI model selection, search/retrieval integration, document processing, and model-identification approach.
- Detailed behavior for uncertain model matches, conflicting sources, missing-manual fallback, and unsafe troubleshooting requests.
- Maintenance schedule derivation, editing and approval flows, time zones, reminder timing, and delivery behavior.
- Email-code authentication flow, household invitations and ownership transfer, privacy controls, and account/data deletion.
- Beta usage limits, initial admission batch size, cost estimates within the US$100/month ceiling, spending controls, and monitoring.
- Database schema, API contracts, background job mechanism, and deployment workflow.
- Testing and acceptance criteria, implementation milestones, and app-store release preparation.

Next step: implement and validate the offline prototype with local reference
material and initial data/API contracts. Resolve live discovery integrations as
an optional connected-mode follow-up. See specification.md section 10 for
stage-specific readiness gaps.

## Current project state

The project directory was empty before this decision record was created. No application code, infrastructure, deployments, or external accounts have been created as part of this discussion.

## Foundation implementation — 2026-09-18

- Repository layout: `backend/` (FastAPI), `web/` (browser client), and `mobile/` (transition Expo client).
- SQLAlchemy owns persistence; Alembic is the single migration owner. PostgreSQL remains the deployment target; SQLite enables isolated local development without external accounts.
- Initial inventory requires a name, brand, model and category. These are foundation constraints, pending the incomplete-identification conversational flow.
- Model confirmation is a separate explicit mutation. Documentation requests require confirmation and are idempotent per household/item.
- Research state is durable in PostgreSQL/SQLite. The foundation worker returns an honest unavailable state for connected discovery until a real provider pipeline lands; offline answers use only local material.
- PostgreSQL tables use RLS with no direct-client grants/policies; all access goes through authenticated backend services. Local fixture authentication is disabled by default and forbidden outside development.
- The browser client uses same-origin fetch calls and local SQLite by default; the transition mobile client continues to use TanStack Query. The browser app is local-only and has not been publicly deployed.

## Repository and release boundary — user correction, 2026-09-18

Supersedes the earlier single-repository choice: `backend/` and `mobile/` are independent repository roots in `homie.code-workspace`. Backend CI lives in `backend/.github/`; mobile owns its own CI. Railway builds only the backend repository, with separate API and worker services. Expo EAS builds the mobile repository for Apple App Store and Google Play. The mobile repository pins an exported OpenAPI snapshot so neither build requires a sibling checkout. Remote repository creation, Railway deployment and app-store publishing have not been performed.

## Shared repository — user correction, 2026-11-20

Supersedes the September 18 repository split: `Ankit-Mehra/homie` contains both `backend/` and `mobile/`, with Git rooted at `homie/` and the existing backend history retained. GitHub Actions workflows live in the root `.github/workflows/` and run in the relevant app directory. Each app retains its lockfile and independent deployment lifecycle. Railway services use `/backend` as their root directory; EAS commands run from `mobile/`. Contract exports and generated types are committed together.

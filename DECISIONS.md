# Product decisions

Last updated: 2026-09-18
Status: Product direction, technology stack, and initial beta behavior agreed; detailed implementation planning remains open.

## Product vision

A household inventory and support assistant for the durable items someone owns: appliances, tools, devices, and eventually vehicles and other non-perishable items with user manuals.

Users identify their items, get answers grounded in relevant manuals and online sources, and track maintenance, repairs, and reminders.

Example: A user reports that their Shark vacuum has become noisy. The assistant identifies the exact model, asks relevant follow-up questions, explains possible causes using cited sources, and provides model-specific filter cleaning or replacement guidance when supported. Maintenance history informs future answers and reminders.

## Agreed first release

- Public product, starting with a free beta with capped AI usage. No billing integration initially; limits are still to be defined.
- Launch audience: Canada and the US, with an English interface.
- Installable iOS and Android apps only. No browser version of the product at launch.
- Broad inventory: users can catalog any durable item. Detailed troubleshooting and maintenance support initially focus on household appliances, tools, and electronics. Broader category support, including vehicles, comes later.
- Troubleshooting is the strongest initial experience, supported by inventory and preventive maintenance features.
- Users can ask for help from a saved item or start with a problem and identify and confirm a new item during the conversation. Adding an inventory item first is not required.
- Add items through a photo of the model label or typed brand/model. Users confirm the identified model and can optionally upload a manual.
- Item details include name, brand/model, category, room, photos, and manuals, plus optional serial number, purchase date, warranty expiry, and receipt.
- Home shows a household overview with upcoming maintenance, recent items, and Ask for help. Troubleshooting uses conversational steps and accepts text and photos; audio/video analysis is deferred.
- Shared households: members access the same inventory, troubleshooting history, and maintenance tasks.
- Maintenance schedules, completion history, and reminders through push notifications and in-app tasks. Email reminders are outside the initial scope.

## Beta access and operating budget

- Total operating budget: US$100 per month for the whole app across all users, not per user.
- This budget includes hosting, database and file storage, AI requests, web search, and transactional email. It excludes development time and app-store registration fees.
- Anyone can register interest through a waitlist; admit users in small batches as measured costs allow.
- Exact user counts, per-user allowances, spending controls, and behavior when limits are reached remain to be defined. The budget is a planning ceiling, not a validated cost estimate.

## Sign-in and shared households

- Sign in using a one-time code sent by email.
- Each user belongs to one household in the beta. Multiple-household switching is outside the initial scope.
- Use owner and member roles. Everyone can manage items and maintenance; only the owner manages membership or deletes the household.
- Members share household inventory, troubleshooting history, and maintenance tasks. Invitation and ownership-transfer details remain open.

## Maintenance schedule approval

- Show proposed tasks, supporting sources, and intervals for user review and adjustment.
- Activate reminders only after the user approves the proposed schedule; do not activate them automatically on item addition.
- When the last completion date is unknown, ask during review for the last service date or a chosen first due date. Leave the task unscheduled until the user chooses; do not assume maintenance starts today.

- When completed maintenance is mentioned in chat, propose the work and completion date and save only after user confirmation.
- Each task has one assigned reminder recipient, defaulting to the person activating it. Allow reassignment and keep tasks visible to all household members.

## Sources and answer behavior

- Manufacturer manuals and official guidance anchor device-specific maintenance and safety instructions.
- Automatic manual discovery is a core requirement of the first working prototype: an agentic process uses device details supplied as text or photos to identify the model and find and retrieve applicable official documentation. Manual upload is optional, never a prerequisite; an upload-only prototype does not meet the intended scope.
- Research official guidance when adding an item, then expand to community sources when a question requires it. Do not perform exhaustive web research for every item upfront.
- Supplement with accessible public web sources, including blogs and Reddit results when available. Dedicated or guaranteed Reddit API access is not a launch requirement.
- Provide source citations and distinguish official instructions from community experiences and possible explanations.
- Establish the device model before presenting model-specific instructions; ask follow-up questions when needed.
- Account for recorded maintenance when troubleshooting or suggesting future work.
- If the exact-model manual cannot be found, explain the gap and offer clearly labeled general checks. Withhold instructions requiring exact-model verification rather than blocking all help.
- Source availability is not guaranteed. Detailed retrieval, conflict handling, and boundaries for unsupported or unsafe instructions remain to be designed.

## Agreed technology and hosting

| Component | Decision |
| --- | --- |
| Mobile apps | React Native with Expo and TypeScript; shared iOS/Android codebase |
| Backend | Python with FastAPI; no C# backend |
| LLM provider | OpenAI API; exact models and tools remain to be selected |
| API and background processing | Railway |
| Database | Supabase-hosted PostgreSQL |
| Authentication and file storage | Supabase |
| Supporting public pages | Vercel only if needed for privacy, support, account deletion, or other supporting pages; no product web app |
| Mobile distribution | Apple App Store and Google Play |

Supabase was selected for the combined database, authentication, and storage offering, rather than database price alone. PostgreSQL and Supabase are not competing database engines: Supabase hosts PostgreSQL. The accepted starting approach is to use the free tier during development and budget for Pro at public launch, subject to checking current pricing and requirements.

Maintainability, scalability, performance on both mobile platforms, and controlled operating costs are priorities. The principal has experience with Python, C#, Terraform, and Azure, but selected Railway and Vercel instead of Azure hosting. Infrastructure-as-code tooling has not yet been selected for this stack.

## Engineering requirements

- Apply feature-based module separation in both FastAPI and React Native, with thin routes/screens, explicit service boundaries, typed contracts, and small reusable components.
- Establish backend/frontend testing and CI from initial scaffolding; include integration, household-isolation, contract, and core mobile journey tests.
- Follow the detailed maintainability, DRY, security, reliability, and definition-of-done requirements in specification.md section 9.
- Start with one modular backend and separately running background workers rather than microservices.
- Run manual discovery, document processing, and reminder preparation outside interactive API requests.
- Use an API contract to keep the Python backend and TypeScript mobile client aligned.
- Verify performance on both platforms, including lower-end Android hardware.
- Reuse verified public research for the same device model across households to reduce costs, while keeping household photos, uploaded files, chats, and maintenance history private to that household. Detailed cache and access-control design remains open.

## Open decisions for the next session

- Detailed onboarding, inventory, chat, maintenance, and household-sharing flows.
- OpenAI model selection, search/retrieval integration, document processing, and model-identification approach.
- Detailed behavior for uncertain model matches, conflicting sources, missing-manual fallback, and unsafe troubleshooting requests.
- Maintenance schedule derivation, editing and approval flows, time zones, reminder timing, and delivery behavior.
- Email-code authentication flow, household invitations and ownership transfer, privacy controls, and account/data deletion.
- Beta usage limits, initial admission batch size, cost estimates within the US$100/month ceiling, spending controls, and monitoring.
- Database schema, API contracts, background job mechanism, and deployment workflow.
- Testing and acceptance criteria, implementation milestones, and app-store release preparation.

Next step: resolve live discovery integrations and initial data/API contracts, then implement the prototype foundation with tests. See specification.md section 10 for stage-specific readiness gaps.

## Current project state

The project directory was empty before this decision record was created. No application code, infrastructure, deployments, or external accounts have been created as part of this discussion.

## Foundation implementation — 2026-09-18

- Repository layout: `backend/` (FastAPI) and `mobile/` (native Expo SDK 55).
- SQLAlchemy owns persistence; Alembic is the single migration owner. PostgreSQL remains the deployment target; SQLite enables isolated local development without external accounts.
- Initial inventory requires a name, brand, model and category. These are foundation constraints, pending the incomplete-identification conversational flow.
- Model confirmation is a separate explicit mutation. Documentation requests require confirmation and are idempotent per household/item.
- Research state is durable in PostgreSQL/SQLite. The foundation worker returns an honest unavailable state until the real provider pipeline lands. This does not satisfy live-discovery acceptance.
- PostgreSQL tables use RLS with no direct-client grants/policies; all access goes through authenticated backend services. Local fixture authentication is disabled by default and forbidden outside development.
- TanStack Query owns mobile server state; openapi-typescript generates contract types. No browser app or public deployment has been created.

## Repository and release boundary — user correction, 2026-09-18

Supersedes the earlier single-repository choice: `backend/` and `mobile/` are independent repository roots in `homie.code-workspace`. Backend CI lives in `backend/.github/`; mobile owns its own CI. Railway builds only the backend repository, with separate API and worker services. Expo EAS builds the mobile repository for Apple App Store and Google Play. The mobile repository pins an exported OpenAPI snapshot so neither build requires a sibling checkout. Remote repository creation, Railway deployment and app-store publishing have not been performed.

## Shared repository — user correction, 2026-11-20

Supersedes the September 18 repository split: `Ankit-Mehra/homie` contains both `backend/` and `mobile/`, with Git rooted at `homie/` and the existing backend history retained. GitHub Actions workflows live in the root `.github/workflows/` and run in the relevant app directory. Each app retains its lockfile and independent deployment lifecycle. Railway services use `/backend` as their root directory; EAS commands run from `mobile/`. Contract exports and generated types are committed together.

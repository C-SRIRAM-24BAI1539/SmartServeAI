# SmartServe AI — Developer Blueprint

This is the implementation handoff for SmartServe AI. It describes the running system as it exists today: the frontend, REST API, PostgreSQL database, authorization middleware, and the intentionally deferred RAG layer.

## What is complete

The application supports customer, provider, and administrator accounts; authentication; profile management; service categories; provider services; booking creation and lifecycle management; reviews; and administrator reporting. The frontend calls the existing REST API directly. AI/RAG enrichment is the one planned but unfinished capability: the Prisma booking fields for an AI job description and estimated price exist, but no API currently populates them. The frontend AI sequence is therefore a polished client-side matching experience, not a claim that server-side RAG is enabled.

## Prerequisites

- Node.js 20+ and npm
- A PostgreSQL database (local PostgreSQL or a managed PostgreSQL instance)
- A database URL, JWT secret, and optional custom API port

## Run the project locally

1. Open two terminals in the repository root.

2. In terminal one, configure `smartserve-backend/.env`:

   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/smartserve"
   JWT_SECRET="use-a-long-random-secret"
   PORT=5000
   ```

   Do not commit this file or its secrets.

3. Create/apply the database schema, then run the API:

   ```powershell
   cd smartserve-backend
   npm.cmd install
   npx.cmd prisma migrate dev --name init
   npm.cmd run dev
   ```

   The API runs at `http://localhost:5000`; its endpoints are prefixed with `/api`.

4. In terminal two, start the Vite application:

   ```powershell
   cd smartserve-frontend
   npm.cmd install
   npm.cmd run dev
   ```

   Open the localhost URL printed by Vite (normally `http://localhost:5173`). The frontend defaults to `http://localhost:5000/api`. To point it to another API, add `smartserve-frontend/.env`:

   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

5. Register a customer and provider in the interface. An administrator account must be assigned directly in the database (instructions below) because public registration exposes only customer and provider roles.

## View and administer the database locally

The schema is defined in `smartserve-backend/prisma/schema.prisma`, using PostgreSQL and Prisma.

### Prisma Studio (recommended visual admin tool)

With the backend `.env` configured and dependencies installed:

```powershell
cd smartserve-backend
npx.cmd prisma studio --config prisma.config.ts
```

Open the URL Prisma prints. You can inspect and edit `User`, profiles, categories, services, bookings, and reviews. Use this only in local/development environments unless you explicitly understand the impact of changing production data.

To promote an existing local user to administrator, open `User` in Prisma Studio and set its `role` to `ADMIN`. The person can then sign in normally and receives the administrator workspace.

### PostgreSQL command line

If the PostgreSQL client is installed, connect using the same `DATABASE_URL` value:

```powershell
psql "postgresql://USER:PASSWORD@localhost:5432/smartserve"
```

Useful read-only commands:

```sql
\dt
SELECT id, name, email, role, "createdAt" FROM "User" ORDER BY "createdAt" DESC;
SELECT id, "serviceName", "basePrice" FROM "ServiceOffered";
SELECT id, status, "bookingDate" FROM "Booking" ORDER BY "createdAt" DESC;
```

To make an administrator through SQL, first identify the intended email, then update exactly that account:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

## Architecture and layout

```text
SmartServe-AI/
├── smartserve-frontend/          React + Vite customer/provider/admin app
│   └── src/
│       ├── App.jsx               Views, UI state, animation, API-driven flows
│       ├── api.js                Fetch client and Bearer-token attachment
│       └── styles.css            Blueprint Meets Paper design tokens and responsive UI
├── smartserve-backend/           Express REST API
│   ├── server.js                 Express setup, CORS, JSON parsing, route mounting
│   ├── routes/                   URL-to-controller mapping
│   ├── controllers/              Request validation and domain actions
│   ├── middleware/               JWT authorization and error handling
│   ├── lib/prisma.js             Shared Prisma client
│   ├── prisma/schema.prisma      PostgreSQL data model
│   └── utils/validation.js       Shared validation helpers
└── DEVELOPER_BLUEPRINT.md        This document
```

### Frontend design and behavior

The application uses one light-only design system, “Blueprint Meets Paper.” The tokens live at the top of `smartserve-frontend/src/styles.css`: warm ivory (`#FAF6EF`) is the base, terracotta is for human-facing actions, and blueprint blue is reserved for AI/data content. Standard UI uses Inter; AI-generated-style content uses JetBrains Mono. Paper grain and faint blueprint dots are intentionally restrained.

`App.jsx` reads a local session from `localStorage` under `smartserve-session`, chooses the appropriate role workspace, and sends the bearer token through `api.js`. Customer mobile views have a fixed bottom navigation. Framer Motion supplies responsive, reduced-motion-aware transitions. Recharts powers the admin demand chart.

Customer flow: describe an issue → client-side AI thinking sequence → transparent request/price presentation → choose a provider service → create booking → track its status → review completed work. The visual AI phase does not call a RAG endpoint yet.

Provider flow: maintain the service catalog, edit profile/availability, and manage bookings in a status-based kanban board. Administrator flow: view platform metrics and activity, administer categories, inspect users, and advance bookings where the API permits it.

### Backend and security flow

`server.js` mounts routes below `/api`. Authentication endpoints return a JWT. Protected calls must send `Authorization: Bearer <token>`; `middleware/auth.js` decodes the JWT and checks the caller’s role before allowing role-scoped operations. `middleware/errors.js` standardizes not-found and error responses.

The primary API areas are:

| Area | Purpose |
| --- | --- |
| `/auth` | Registration and login |
| `/profile/me` | Customer/provider profile read and update |
| `/categories` | Public read; administrator management |
| `/services` | Public service discovery; provider catalog management |
| `/providers` | Provider discovery and provider dashboard |
| `/bookings` | Customer requests, all-role reads, lifecycle actions |
| `/reviews` | Customer review submission and provider review lookup |
| `/admin` | Platform metrics and users |

### Database model

`User` is the identity table with one `Role`: `CUSTOMER`, `PROVIDER`, or `ADMIN`. A user can have a `CustomerProfile` or `ProviderProfile`. Providers publish `ServiceOffered` records under `ServiceCategory`. A `Booking` relates a customer to an optional provider and service, and can receive one `Review`.

Booking state is controlled by the server: `PENDING → ACCEPTED → IN_PROGRESS → COMPLETED`. A pending request can be rejected; customers may cancel while pending or accepted. Do not make UI-only status assumptions—server-side validation is authoritative.

## Development conventions

- Keep all visual colors routed through the frontend token definitions; do not introduce a dark mode or generic Tailwind palettes.
- Keep JetBrains Mono limited to AI/data content. Standard controls and body copy use Inter.
- Keep data access inside `api.js` or its callers; do not embed API base URLs throughout components.
- Preserve API authorization boundaries. A UI control is not a security control—the backend role middleware remains the source of truth.
- Run `npm.cmd run build` in `smartserve-frontend` before handing off frontend changes.
- After schema edits, create and commit a Prisma migration; do not rely on an untracked local database state.

## RAG implementation boundary

The schema already reserves `KnowledgeBaseEntry`, `Booking.aiGeneratedJobDesc`, `Booking.aiEstimatedPriceMin`, and `Booking.aiEstimatedPriceMax`. Completing RAG should add a server-side retrieval/enrichment service, validate generated output, persist the result on the booking, expose it from an authenticated booking endpoint, and then replace the frontend’s presentational AI estimate with returned data. Keep model/API keys server-side in environment variables; never add them to `VITE_*` variables.

npx prisma studio

# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep the React app focused on rendering data from the shared `/api` client, with loading, empty, and error states for each capability so the browser contract matches the backend behavior without direct database or fetch bypasses.
- Logic tier decision: Implement the Express API as the single boundary for validation and business logic, returning deliberate 4xx responses for malformed IDs, missing records, and invalid payloads instead of leaking cast errors or 500s.
- Data tier decision: Define the Mongoose schemas and seed script to enforce required fields and seeded relationships, then keep MongoDB access isolated to the data model layer so the API stays decoupled from persistence details.
- Activity tracking approach: Validate `userId` and `teamId` against real user/team documents, store the normalized user and team references, calculate `points` and `occurredAt`, and return a created activity plus list results from the API contract.
- Team management approach: Require `name` and `mascot`, default the `members` array to an empty list, and preserve member IDs when listing and creating teams so the leaderboard and team views reflect real relationships.
- Leaderboard approach: Aggregate team activity points across all related records, sort highest first, and assign a 1-based rank to each team entry so the API contract returns stable, deterministic rankings.
- Workout suggestions approach: Match the requested user email to a seeded user, inspect recent activity patterns or the user’s fitness goal, then return workout suggestions ordered by relevance with a descriptive reason and a deliberate 4xx for unknown emails.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - Fails when the Mongoose models do not enforce required fields, relationships, or seed data invariants; this is the root contract for user, team, activity, and workout validation.
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - Fails when the Express routes do not validate input, convert malformed IDs to 4xx responses, create/list activities correctly, or calculate leaderboard and workout recommendation behavior according to the contract.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - Fails when the presentation layer does not render API data, display loading/empty/error states, or request the correct user-specific workout endpoint while preserving accessible roles and text.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - Confirms the TypeScript logic tier compiles cleanly after the data and API contracts are implemented.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - Confirms the React UI and shared API client compile cleanly once the data and API layers satisfy the contract.

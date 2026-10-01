# UniFlow API

NestJS + Prisma API for authentication, course progress, tasks, the study library, and administrator actions.

## Local setup

1. Start PostgreSQL from the repository root:

   ```bash
   docker compose up -d db
   ```

2. In `server/`, create a local environment file and install dependencies:

   ```bash
   cp .env.example .env
   npm ci
   npm run db:generate
   npm run db:migrate
   ```

   Change `JWT_SECRET` before exposing the API publicly. `ADMIN_EMAIL` grants administrator access only to a new account registered with that exact email; to promote an existing account, run `npm run admin:promote -- person@example.com` from a trusted shell.

3. Start the API:

   ```bash
   npm run start:dev
   ```

   The API listens on `0.0.0.0:3000`. It seeds a small starter catalog (courses and practice tasks) idempotently on startup. Uploaded PDFs are stored under `server/uploads/papers` by default; files are not publicly served and are downloaded through the authenticated `GET /papers/:id/download` endpoint.

4. In a second terminal, run the static client and same-origin API proxy:

   ```bash
   npm run preview:web
   ```

   Open `http://localhost:4173`. The proxy forwards browser requests from `/api/*` to the API, so the client never needs a browser-side localhost URL. Set `API_TARGET` if the API is running elsewhere.

## API surface

All routes are relative to the API origin. After registration or login, send the returned JWT as `Authorization: Bearer <token>` for protected routes.

| Method and route | Purpose | Access |
| --- | --- | --- |
| `GET /health` | API health check | Public |
| `POST /auth/register`, `POST /auth/login` | Create an account or sign in | Public |
| `GET /me` | Current account profile | Signed in |
| `GET /courses`, `GET /courses/mine` | Course catalog and selected courses | Signed in |
| `POST /courses/select`, `POST /courses/progress` | Save selected courses and progress | Signed in |
| `GET /tasks`, `GET /tasks/mine` | Task catalog and personal checklist | Signed in |
| `POST /tasks/select`, `POST /tasks/complete` | Save checklist and completion state | Signed in |
| `GET /papers`, `GET /papers/:id/download`, `GET /books` | Study-library listings and protected PDF download | Signed in |
| `POST /assistant/chat` | Local guided-study prompts | Signed in |
| `POST /admin/courses`, `/admin/tasks`, `/admin/books`, `/admin/papers/upload` | Manage learning content and PDF uploads | Administrator |

The assistant uses deterministic local study prompts; it does not call a hosted language model. Logout is handled by removing the stateless JWT from browser storage. Password-reset email and payment processing are not configured in this repository.

## Useful commands

```bash
npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run lint
```

Apply committed migrations in production with `npm run db:migrate` before starting the built API. `CLIENT_ORIGIN` accepts a comma-separated allowlist for clients that call the API directly; same-origin proxy deployments do not need CORS. The default local JWT secret is for development only.

The local PDF upload directory is not a production object store. Use a persistent, access-controlled object-storage service for production deployments and back it up separately from PostgreSQL.

# UniFlow

UniFlow is a student learning workspace with a static web client, a NestJS API, and PostgreSQL storage. The repository also contains the separate terminal bookkeeping application in `MyAccountingSoftware/`.

## Run the learning platform locally

Requirements: Node.js 20+, npm, and Docker Compose.

1. Start the database:
   ```bash
   docker compose up -d db
   ```
2. Configure and migrate the API:
   ```bash
   cd server
   cp .env.example .env
   npm ci
   npm run db:generate
   npm run db:migrate
   ```
3. In one terminal, start the API with `npm run start:dev` from `server/`.
4. In another terminal, start the web client with `npm run preview:web` from `server/` and open `http://localhost:4173`.

The API seeds starter courses and tasks on startup. Set `ADMIN_EMAIL` before registering the administrator account, or promote an existing user from a trusted shell with `npm run admin:promote -- email@example.com`. Set a unique `JWT_SECRET` before any public deployment. If the static site and API are deployed on different origins, define `window.UNIFLOW_API_BASE` (for example, `https://api.example.com`) before page modules run, and set the API `CLIENT_ORIGIN` to the site origin. See `server/README.md` for the API, migration, test, upload-storage, and deployment details.

## Run the separate accounting application

```bash
cd MyAccountingSoftware
python main.py
```

The accounting application uses its own SQLite database. Back up `accounting.db` before making operational changes; the source databases in this repository should be treated as user data.

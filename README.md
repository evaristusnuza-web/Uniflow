# UniFlow

UniFlow is a student learning workspace with a static web client, NestJS API, and PostgreSQL storage. The repository also includes **KoraLedger**, a local desktop accounting and distribution application built around the existing company SQLite file.

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

The API seeds starter courses and tasks on startup. Set `ADMIN_EMAIL` before registering the administrator account, or promote an existing user from a trusted shell with `npm run admin:promote -- email@example.com`. Set a unique `JWT_SECRET` before any public deployment. If the static site and API are deployed on different origins, define `window.UNIFLOW_API_BASE` before page modules run and set the API `CLIENT_ORIGIN` to the site origin. See `server/README.md` for API, migration, testing, upload-storage, and deployment details.

## Run KoraLedger Accounting & Distribution

Requirements: Python 3.10+ with Tkinter (usually included with desktop Python installations). On Debian/Ubuntu, install the Tk bindings with `sudo apt install python3-tk` if they are missing.

```bash
cd MyAccountingSoftware
python main.py
```

The default launcher opens a module-driven desktop workspace with customer and supplier records, sales and purchase invoices, inventory, cash receipts and disbursements, journal entry, general ledger, and financial statements. Posted sales, purchases, receipts, supplier payments, opening stock, and stock-count variances update both operational records and the double-entry ledger. The layout takes cues from established desktop ERP workflows; KoraLedger is an independent application and is not Sage 100.

Use `python main.py --cli` to open the retained English, French, and Kinyarwanda terminal interface. `python main.py --help` lists the launch options.

The accounting application uses `MyAccountingSoftware/accounting.db` by default. This company file is local business data: back it up before operating, moving, or upgrading the application. To work with a different company file or an isolated test database, set `ACCOUNTING_DB_PATH` to the full path before starting Python. The repository's accounting tests set this variable to a temporary test file and do not use the populated company databases.

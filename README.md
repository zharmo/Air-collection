Air Collection
==============

Full-stack clothing shop with a Next.js client and an NestJS/PostgreSQL API.

## Requirements

- Node.js 22+
- PostgreSQL 14+
- npm

## Local Setup

1. Install dependencies:

```bash
npm run install:all
```

2. Create the local database, then initialize the tables:

```bash
createdb air_collection
npm run init-db
```

3. Check environment files:

- `client/.env.local` points the client at `http://localhost:5000/api`.
- `server/.env` contains local PostgreSQL credentials. Update `DB_USER`, `DB_PASSWORD`, or `DB_NAME` if your database differs.

4. Run both apps:

```bash
npm run dev
```

The client runs on `http://localhost:3000`; the API runs on `http://localhost:5000`.

## Useful Scripts

- `npm run dev` starts the client and server together.
- `npm run dev:client` starts only the Next.js client.
- `npm run dev:server` starts only the NestJS API.
- `npm run init-db` creates or updates the local PostgreSQL tables.
- `npm run build` builds the Next.js client.
- `npm run lint` runs the client ESLint checks.

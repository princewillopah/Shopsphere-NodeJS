# ShopSphere — NODEJS

**Status: implemented.** Node.js (Express) rewrite of the ShopSphere e-commerce app
on a **MySQL** database.

This is a production-oriented rebuild of the original Node/Express + MongoDB app —
same language, upgraded architecture — plus the same React frontend adapted to be
**host-independent**.

```
NodeJS/
├── backend/     Express API (Node 20, MySQL, S3, JWT) — see backend/README.md
└── frontend/    React + Vite SPA, decoupled from the backend (build-time VITE_API_URL)
```

## Design decisions

| Area  | This version (Node/MySQL) |
|---|---|
| Framework |  **Express** with controllers/services/middleware layers |
| Database |  **MySQL** (Sequelize ORM + CLI migrations) |
| Auth |  **JWT `Authorization: Bearer`** (cross-origin friendly) |
| Images |  **AWS S3** (absolute URLs), `StorageService` abstraction |
| Validation | **express-validator** |
| Hardening |  **helmet**, CORS allow-list, central error handler |
| Frontend coupling | **`VITE_API_URL`** only — deployable to S3/Netlify |
| Hosting | **EC2 + systemd** (Docker deferred) |
| IDs | UUID (CHAR(36)), exposed as `_id` for API compatibility |

The REST contract (`_id`, `isAdmin`, image = absolute URL, endpoint paths) is
preserved so the React app changes are minimal.

## Run it
- **Backend:** see [`backend/README.md`](backend/README.md) — for more information
- **Frontend:** set `VITE_API_URL` (see [`frontend/.env.example`](frontend/.env.example)) for more information

- **Backend:** see [`backend/README.md`](backend/README.md) — for more information
- **Frontend:** set `VITE_API_URL` (see [`frontend/.env.example`](frontend/.env.example)),
  then `npm install && npm run build`; deploy the `dist/` output to S3/CloudFront/Netlify.

## Not included yet

- Dockerfiles / container build (to be added later).
- CI/CD, IaC (Terraform/Ansible), observability.

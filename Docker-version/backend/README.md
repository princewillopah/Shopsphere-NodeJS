# ShopSphere Backend — Node.js (Express)

Production-grade REST API for ShopSphere, rebuilt from the original Node/Express
app onto **MySQL**. Runs as a Node process on an **EC2 instance** (no Docker yet),
backed by **MySQL (RDS)** and **AWS S3** for images.

## Stack

| Concern | Choice |
|---|---|
| Language / runtime | Node.js 20 (ES modules) |
| Framework | Express 4 |
| Database | MySQL via **Sequelize 6**, schema managed by **sequelize-cli migrations** |
| Auth | Stateless **JWT** (`Authorization: Bearer`), bcrypt passwords |
| Validation | **express-validator** |
| Hardening | **helmet**, CORS allow-list, central JSON error handler |
| Image storage | **AWS S3** (via a `StorageService` abstraction, AWS SDK v3) |
| Docs | OpenAPI / Swagger UI at `/docs` |

## Architecture

```
React SPA (hosted separately: S3/CloudFront/Netlify)
        │  HTTPS + Authorization: Bearer <JWT>
        ▼
Express API (systemd service on EC2, port 5000)
        ├── MySQL (RDS)               — users, products, orders, reviews
        └── AWS S3                    — product images (returns absolute URLs)
```

The frontend is **fully decoupled**: it talks to the API only via the build-time
`VITE_API_URL`, and images are absolute S3/CloudFront URLs returned by the API.

## What changed vs. the original

- **MongoDB → MySQL** (Sequelize models + a CLI migration).
- **Cookie JWT → Bearer JWT** so the SPA can be hosted cross-origin.
- **Local `/uploads` disk → S3.** `Product.image` now stores an absolute URL.
- **Server-side order total** is recomputed (anti-tampering) instead of trusting the client.
- Layered structure (routes → controllers → models), `express-validator`, `helmet`,
  a global `{ "message": ... }` error handler, health endpoints, Swagger, RBAC, and
  IAM-role credentials (no static keys).

## Project layout

```
backend/
├── src/
│   ├── server.js             # entrypoint: validate config, connect DB, listen
│   ├── app.js                # express app: helmet, cors, routes, error handler
│   ├── config/               # env + Sequelize instance
│   ├── models/               # Sequelize models + associations
│   ├── controllers/          # request handlers
│   ├── routes/               # routers (+ validation)
│   ├── middleware/           # auth, validate, errorHandler
│   ├── serializers/          # model → API response mappers
│   ├── storage/              # StorageService + S3 implementation
│   ├── docs/                 # OpenAPI spec
│   └── seed/seed.js          # idempotent admin + sample products
├── migrations/               # sequelize-cli migrations
├── config/config.cjs         # sequelize-cli DB config (env-driven)
├── package.json
└── deploy/shopsphere-backend.service
```

## Prerequisites

- Node.js 18+ (tested on 20) and npm
- A MySQL 8 database (RDS recommended)
- An S3 bucket for images, and an **EC2 instance IAM role** granting `s3:PutObject`
  (+ `s3:GetObject` if you serve via presigned URLs) on that bucket
- (Optional) CloudFront distribution in front of the bucket

## Configuration

All config is read from environment variables — see [`.env.example`](.env.example).
Nothing sensitive is committed. Key variables:

| Variable | Purpose |
|---|---|
| `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD` | MySQL connection |
| `JWT_SECRET` | HMAC secret, **≥ 32 chars** (app fails fast if missing) |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins, or `*` |
| `S3_BUCKET`, `AWS_REGION`, `S3_KEY_PREFIX` | Image storage |
| `S3_PUBLIC_BASE_URL` | Optional CloudFront/custom domain for image URLs |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Optional first admin |

> On EC2, AWS credentials come from the **instance IAM role** — do not set access keys.

## Build & run (local)

```bash
npm install

# Export config (or use a .env file in this directory)
export JWT_SECRET="$(openssl rand -base64 48)"
export DB_HOST=127.0.0.1 DB_NAME=shopsphere DB_USER=shopsphere DB_PASSWORD=secret
export S3_BUCKET=my-bucket AWS_REGION=us-east-1

npm run migrate     # apply the schema
npm run seed        # optional: admin + sample products
npm start           # http://localhost:5000
```

Swagger UI: `http://localhost:5000/docs`.

## Deploy on EC2 (systemd, no Docker)

```bash
# 1. Install Node.js 20 (NodeSource) + build tools as needed
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Create a service user and dirs
sudo useradd --system --no-create-home shopsphere
sudo mkdir -p /opt/shopsphere /etc/shopsphere

# 3. Copy the app and install production deps
sudo cp -r src migrations config package.json package-lock.json /opt/shopsphere/
sudo npm ci --omit=dev --prefix /opt/shopsphere

# 4. Copy the env file and EDIT it with real values
sudo cp .env.example /etc/shopsphere/backend.env
sudo chown -R shopsphere:shopsphere /opt/shopsphere
sudo chmod 600 /etc/shopsphere/backend.env

# 5. Install the unit and start (runs migrate + seed via ExecStartPre)
sudo cp deploy/shopsphere-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now shopsphere-backend
sudo systemctl status shopsphere-backend
curl http://localhost:5000/health
```

Put an Nginx reverse proxy (TLS) in front for production, or expose via an ALB.

## API summary

| Method | Path | Auth |
|---|---|---|
| POST | `/api/users/signup` · `/api/users/login` | public |
| GET | `/api/users/profile` | user |
| GET | `/api/products` · `/api/products/{id}` | public |
| POST/PUT/DELETE | `/api/products` · `/api/products/{id}` | admin (multipart) |
| POST | `/api/orders` · GET `/api/orders/myorders` | user |
| POST | `/api/reviews/{productId}` | user |
| GET | `/api/reviews/product/{productId}` | public |
| GET | `/api/admin/stats` · `/users` · `/products` | admin |
| DELETE | `/api/admin/users/{id}` | admin |
| GET | `/health` · `/api/health` | public |

Swagger UI: `http://<host>:5000/docs`

## Security notes

- JWT is signed with HS256; keep `JWT_SECRET` in a secrets manager in real prod.
- The SPA stores the JWT in `localStorage` (the standard trade-off for a decoupled
  cross-origin SPA). Mitigate with short token lifetimes + strict CSP.
- AWS access uses the EC2 instance role — no long-lived keys.

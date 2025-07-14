# 🛠️ CMMS Backend

A modern, scalable **Computerized Maintenance Management System (CMMS)** backend built with **Node.js**, **Express**, and **PostgreSQL**.  
Manage machines, parts, maintenance, users, and more — all with robust APIs and enterprise features.

---

## 🚀 Features

- 🔒 **Authentication & RBAC** (JWT, roles: admin, leader, technician, worker)
- 🏭 **Machine & Asset Management** (QR code support, sectors, grid locations)
- 📝 **Maintenance Reports** (breakdowns, assignments, escalation, archiving)
- 🧩 **Parts Inventory** (stock, requests, low stock alerts, categories)
- 📦 **File Uploads** (report images, part documents, secure static serving)
- 📊 **Statistics & Analytics** (leaderboards, SLA, productivity metrics)
- 🛡️ **Security** (rate limiting, input sanitization, CORS, helmet)
- 🧪 **Testing** (Jest, integration/unit/fixtures)
- 🐳 **Dockerized** (PostgreSQL, Redis, API, ready for production)
- 📚 **API-first** (RESTful, documented, easy to integrate)

---

## 📁 Project Structure

```
CMMS Backend/
├── src/                # Source code (app.js, routes, controllers, models, etc.)
├── database/           # SQL migrations, seeds, init scripts
├── tests/              # Unit/integration tests & fixtures
├── uploads/            # Uploaded files (reports, parts, etc.)
├── logs/               # Log files
├── .env.example        # Example environment variables
├── docker-compose.yml  # Docker multi-service config
├── Dockerfile          # API Docker build
├── package.json        # NPM scripts & dependencies
└── README.md           # This file
```

---

## ⚡ Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-org/cmms-backend.git
cd "CMMS Backend"
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your secrets:

```bash
cp .env.example .env
# Edit .env as needed
```

### 3. Run with Docker (Recommended)

```bash
docker-compose up --build
```

- API: [http://localhost:5000](http://localhost:5000)
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

### 4. Manual Local Run

Make sure PostgreSQL and Redis are running, then:

```bash
npm run migrate   # Run DB migrations
npm run seed      # Seed initial data
npm run dev       # Start API in dev mode
```

---

## 🔑 Environment Variables

See [.env.example](.env.example) for all options, including:

- Database (PostgreSQL) connection
- JWT secrets & expiry
- Firebase (notifications)
- File upload limits
- Rate limiting & CORS

---

## 🧬 Database

- **PostgreSQL** schema and seed data in [`/database`](database/)
- Run migrations and seeds with:
  ```bash
  npm run migrate
  npm run seed
  ```
- Example tables: `users`, `machine_map`, `parts`, `reports`, etc.

---

## 🛣️ API Overview

All endpoints are prefixed with `/api`.

| Area         | Example Routes                                 |
|--------------|------------------------------------------------|
| Auth         | `POST /api/auth/login`, `/refresh`, `/logout`  |
| Users        | `GET /api/users`, `POST /api/users`, ...       |
| Machines     | `GET /api/machines`, `POST /api/machines`, ... |
| Parts        | `GET /api/parts`, `POST /api/parts`, ...       |
| Reports      | `GET /api/reports`, `POST /api/reports`, ...   |
| Files        | `POST /api/files/upload`, ...                  |
| Admin/Stats  | `GET /api/admin/health`, `/api/stats/*`        |

➡️ **See [`API_ROUTES.md`](#) for a full list of endpoints.**

---

## 🧪 Testing

- Run all tests:  
  ```bash
  npm test
  ```
- Test data/fixtures: [`/tests/fixtures`](tests/fixtures/)

---

## 🐳 Docker Compose

- **PostgreSQL**, **Redis**, and **API** containers
- Volumes for persistent data and uploads
- See [`docker-compose.yml`](docker-compose.yml)

---

## 📊 Monitoring & Health

- Health check: `GET /api/admin/health`
- System info: `GET /api/admin/system/info`
- Logs: `/logs/` directory

---

## 🛡️ Security

- Helmet, CORS, input sanitization, SQL injection prevention
- Rate limiting (see `.env`)
- JWT authentication & refresh tokens

---

## 👥 Contributing

1. Fork & branch from `main`
2. Add your feature/fix
3. Run tests & lint (`npm run lint`)
4. Open a Pull Request 🚀

---

## 📄 License

MIT © CMMS Development Team

---

## 🙏 Acknowledgements

- [Express](https://expressjs.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [Docker](https://www.docker.com/)
- [Jest](https://jestjs.io/)
- [Firebase](https://firebase.google.com/)

---

> Made with ❤️
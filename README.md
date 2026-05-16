# ⚡ AI API Platform

A full-stack SaaS platform that lets developers summarize text via a simple REST API. Built with Node.js, Next.js, FastAPI, and a HuggingFace DistilBART model — secured with JWT auth, API keys, and Redis rate limiting.

---

## What it does

- **Register** and get an account with a FREE or PRO tier
- **Generate API keys** from a dashboard — shown once, stored as bcrypt hashes
- **Call the summarization API** with your key — returns an AI-generated summary in seconds
- **Track usage** — 30-day request history with a live chart, success/error breakdown, and daily rate limit progress
- **Auto token refresh** — seamless re-authentication without logging out

---

## Architecture

```
Browser (Next.js :3000)
        │
        ▼
Express API (:4000)
 ├── /auth      JWT register, login, refresh, logout
 ├── /keys      API key generate, list, revoke
 ├── /api       Summarize — accepts JWT cookie OR x-api-key
 └── /usage     Usage stats and history
        │
        ├──── Supabase (PostgreSQL)
        │      users, api_keys, usage_logs
        │
        ├──── Redis
        │      rate limit counters, token blacklist
        │
        └──── FastAPI ML Service (:8001)
               HuggingFace DistilBART model
```

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, Tailwind CSS, Recharts |
| Backend | Node.js, Express |
| ML Service | Python, FastAPI, HuggingFace Transformers |
| Model | `sshleifer/distilbart-cnn-12-6` |
| Auth | JWT (httpOnly cookies) + API key (bcrypt hashed) |
| Database | Supabase (PostgreSQL) |
| Cache | Redis — rate limiting + token blacklist |
| Deploy | Vercel (frontend) · Railway (backend + ML) |

---

## JWT Auth Flow

```
Register/Login
  → access_token  (4h,  httpOnly cookie)
  → refresh_token (7d,  httpOnly cookie)

Every request
  → verifyJWT middleware reads cookie
  → expired? → POST /auth/refresh → new access_token (silent)
  → blacklisted? (Redis) → 401

Logout
  → refresh_token added to Redis blacklist with TTL
  → both cookies cleared
```

API key requests skip cookies entirely — the `x-api-key` header is hashed and compared against the DB.

---

## Rate Limits

| Plan | Requests/day |
|---|---|
| FREE | 100 |
| PRO | 2,000 |
| ADMIN | Unlimited |

Enforced per user per day via Redis INCR. Remaining count returned in `X-RateLimit-Remaining` header on every response.

---

## Local Setup

### Prerequisites
- Node.js 18+
- Python 3.11
- Docker (for Redis) or a Redis Cloud account
- Supabase account (free)

### 1. Clone
```bash
git clone https://github.com/AnushiBisht/api-platform.git
cd api-platform/fullapp
```

### 2. Database — Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor → New Query**
3. Paste the contents of `backend/src/config/migrate.sql` and click **Run**
4. Tables created: `users`, `api_keys`, `usage_logs`

### 3. Redis
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

### 4. Backend
```bash
cd backend
npm install
cp .env.example .env
```

Fill in `.env`:
```env
PORT=4000
JWT_SECRET=           # node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_REFRESH_SECRET=   # run above command again
SUPABASE_URL=         # from Supabase → Settings → API
SUPABASE_SERVICE_KEY= # service_role key from Supabase → Settings → API → Legacy keys
REDIS_URL=redis://localhost:6379
ML_SERVICE_URL=http://localhost:8001
CLIENT_URL=http://localhost:3000
```

```bash
npm run dev   # → http://localhost:4000
```

### 5. ML Service
```bash
cd ../ml-service
python -m venv venv
venv\Scripts\activate     # Windows
# source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
cp .env.example .env      # set JWT_SECRET — must match backend exactly
uvicorn main:app --port 8001 --reload
# First run downloads DistilBART model (~500MB) — cached after that
```

### 6. Frontend
```bash
cd ../frontend
npm install
cp .env.example .env.local
# set NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev   # → http://localhost:3000
```

---

## API Reference

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login, get tokens |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout, blacklist token |
| GET | `/auth/me` | Get current user |

### Keys

| Method | Endpoint | Description |
|---|---|---|
| POST | `/keys/generate` | Generate new API key |
| GET | `/keys` | List active keys |
| DELETE | `/keys/:id` | Revoke a key |

### Summarize

```bash
POST /api/summarize

# With API key (programmatic)
curl -X POST https://your-api.com/api/summarize \
  -H "x-api-key: aip_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{"text": "Your long text to summarize (min 50 chars)..."}'

# Response
{
  "summary": "AI-generated summary of your text.",
  "latency_ms": 843
}
```

### Error Codes

| Code | Meaning |
|---|---|
| 400 | Text too short (min 50 chars) |
| 401 | Missing or invalid token / API key |
| 429 | Rate limit exceeded |
| 503 | ML service unavailable |

---

## Project Structure

```
fullapp/
├── backend/
│   └── src/
│       ├── config/        db.js, redis.js, migrate.sql
│       ├── middleware/    verifyJWT, verifyApiKey, rateLimiter, requireRole
│       ├── routes/        auth, keys, api, usage
│       └── services/      token.service, usage.service
│
├── ml-service/
│   ├── main.py            FastAPI app
│   └── routers/
│       └── predict.py     Summarization endpoint
│
└── frontend/
    └── src/
        ├── app/
        │   ├── page.tsx           Landing page
        │   ├── (auth)/            Login, Register
        │   ├── dashboard/         Usage chart, stats
        │   ├── dashboard/api-keys API key manager
        │   └── docs/              API reference
        ├── components/    Sidebar
        └── lib/           Axios instance with auto-refresh
```

---

## Security Highlights

- Passwords hashed with **bcrypt** (saltRounds=10)
- JWT stored in **httpOnly cookies** — not localStorage, not vulnerable to XSS
- API keys stored as **bcrypt hashes** — raw key shown once, never retrievable
- Refresh tokens **blacklisted in Redis** on logout
- ML service only accepts requests from the backend — not publicly exposed
- Rate limiting per user per day via **Redis INCR**

---

## Author

**Anushi Bisht** — [github.com/AnushiBisht](https://github.com/AnushiBisht)

##Demo
<img width="1336" height="595" alt="1" src="https://github.com/user-attachments/assets/56d2370a-4f00-45fa-b821-5ae7b0131e40" />
<img width="1365" height="595" alt="4" src="https://github.com/user-attachments/assets/f22df2f3-9fc3-41bd-86a3-ed415f353f64" />
<img width="1365" height="596" alt="3" src="https://github.com/user-attachments/assets/cee8d000-fbb2-46b3-811c-7b3e938dab37" />
<img width="1346" height="591" alt="2" src="https://github.com/user-attachments/assets/aa6b7f8c-eaef-45dd-bc9c-ee163014e5f7" />
<img width="774" height="630" alt="5" src="https://github.com/user-attachments/assets/bb717a04-cdd0-4a1d-9755-d164659a8c6c" />


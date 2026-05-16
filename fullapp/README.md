# ⚡ AI API Platform

A full-stack SaaS platform for text summarization via API. Users sign up, generate API keys, call the hosted HuggingFace model, and track usage in a dashboard.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, Tailwind CSS, Recharts |
| Backend | Node.js, Express |
| ML Service | FastAPI, HuggingFace Transformers (DistilBART) |
| Auth | JWT access + refresh tokens (httpOnly cookies) + API keys |
| Database | Supabase (PostgreSQL) |
| Cache | Redis (rate limiting + token blacklist) |

## Project Structure

```
ai-api-platform/
├── backend/          Node.js / Express API
├── ml-service/       FastAPI + HuggingFace model
└── frontend/         Next.js dashboard
```

## Setup

### 1. Supabase
1. Create a project at supabase.com
2. Go to SQL Editor → New Query → paste contents of `backend/src/config/migrate.sql` → Run

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env    # fill in SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT secrets
npm run dev             # runs on http://localhost:4000
```

### 3. ML Service
```bash
cd ml-service
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # set JWT_SECRET (same as backend)
uvicorn main:app --port 8001 --reload
# First run downloads the DistilBART model (~500MB), cached after that
```

### 4. Frontend
```bash
cd frontend
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL
npm run dev                  # runs on http://localhost:3000
```

## API Usage

```bash
# Register
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"password123"}'

# Summarize (with API key)
curl -X POST http://localhost:4000/api/summarize \
  -H "x-api-key: aip_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{"text": "Your long text to summarize..."}'
```

## Rate Limits

| Plan | Requests/day |
|---|---|
| FREE | 100 |
| PRO | 2,000 |

Limits enforced via Redis. Remaining count returned in `X-RateLimit-Remaining` header.

## JWT Flow

```
Login  →  access_token (4h, httpOnly cookie) + refresh_token (7d, httpOnly cookie)
Request →  verifyJWT middleware reads cookie, verifies signature
401    →  frontend interceptor hits /auth/refresh automatically
Logout →  refresh_token added to Redis blacklist, cookies cleared
```

-- Run this in Supabase → SQL Editor → New Query

-- ─── Users ───────────────────────────────────────────────────────────────────
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  password_hash text not null,
  role          text not null default 'FREE',   -- FREE | PRO | ADMIN
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── API Keys ─────────────────────────────────────────────────────────────────
create table if not exists api_keys (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  key_hash    text not null unique,
  label       text not null,
  created_at  timestamptz not null default now(),
  revoked_at  timestamptz
);

-- ─── Usage Logs ───────────────────────────────────────────────────────────────
create table if not exists usage_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  api_key_id  uuid references api_keys(id) on delete set null,
  endpoint    text not null,
  status      int not null,
  latency_ms  int not null,
  created_at  timestamptz not null default now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_api_keys_user_id on api_keys(user_id);
create index if not exists idx_usage_logs_user_id on usage_logs(user_id);
create index if not exists idx_usage_logs_created_at on usage_logs(created_at);

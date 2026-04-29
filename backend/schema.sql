-- ClimbCrew - schéma de base + accès utilisateurs

create table if not exists participants (
  id bigserial primary key,
  nom text not null,
  prenom text not null,
  passport text not null default 'sans',
  cotisation boolean not null default false,
  ffme boolean not null default false,
  can_encadrer boolean not null default false,
  can_referer boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id text primary key,
  date text not null,
  slot text not null check (slot in ('midi', 'soir')),
  status text not null default 'fermee',
  encadrant_id text,
  referent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists session_participants (
  session_id text not null references sessions(id) on delete cascade,
  participant_id text not null,
  created_at timestamptz not null default now(),
  primary key (session_id, participant_id)
);

create index if not exists idx_sessions_date on sessions(date);
create index if not exists idx_session_participants_participant on session_participants(participant_id);

create table if not exists users (
  id bigserial primary key,
  participant_id bigint references participants(id) on delete set null,
  email text unique not null,
  prenom text not null,
  nom text not null,
  password_hash text not null,
  role text not null default 'user',
  status text not null default 'pending',
  must_reset_password boolean not null default false,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  revoked_at timestamptz,
  revoked_reason text,
  last_login_at timestamptz
);

create index if not exists idx_users_email on users(lower(email));
create index if not exists idx_users_status on users(status);

create table if not exists user_sessions (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  token_hash text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  user_agent text,
  ip_address text
);

create index if not exists idx_user_sessions_user on user_sessions(user_id);
create index if not exists idx_user_sessions_token_hash on user_sessions(token_hash);

create table if not exists password_reset_tokens (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  token_hash text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);

create index if not exists idx_password_reset_tokens_user on password_reset_tokens(user_id);
create index if not exists idx_password_reset_tokens_hash on password_reset_tokens(token_hash);

create table if not exists access_logs (
  id bigserial primary key,
  user_id bigint references users(id) on delete set null,
  event_type text not null,
  success boolean not null default true,
  ip_address text,
  user_agent text,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_access_logs_created_at on access_logs(created_at desc);
create index if not exists idx_access_logs_event_type on access_logs(event_type);

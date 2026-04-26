-- Schéma ClimbCrew : participants + séances + inscriptions

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

create index if not exists idx_sessions_date
on sessions(date);

create index if not exists idx_session_participants_participant
on session_participants(participant_id);

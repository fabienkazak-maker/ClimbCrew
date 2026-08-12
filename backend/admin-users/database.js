import pg from "pg";

const OriginalPool = pg.Pool;
let capturedPool = null;
let captureInstalled = false;

/**
 * Intercepte la création du Pool PostgreSQL du serveur principal.
 * Le module est préchargé avant server.js, ce qui permet aux services séparés
 * d'utiliser exactement la même connexion sans dupliquer la configuration.
 */
export function installPoolCapture() {
  if (captureInstalled) return;

  pg.Pool = class ClimbCrewCapturedPool extends OriginalPool {
    constructor(...args) {
      super(...args);
      capturedPool = this;
    }
  };

  captureInstalled = true;
}

/** Retourne la connexion partagée ou lève une erreur explicite. */
export function getPool() {
  if (!capturedPool) {
    throw new Error("Connexion PostgreSQL ClimbCrew introuvable");
  }
  return capturedPool;
}

/**
 * Migration idempotente : elle peut être rejouée à chaque démarrage.
 * Les deux représentations historiques du droit administrateur sont alignées.
 */
export async function ensureAdminUserSchema() {
  const pool = getPool();

  await pool.query(`alter table users add column if not exists is_admin boolean not null default false`);
  await pool.query(`alter table users add column if not exists email_verified_at timestamptz`);
  await pool.query(`alter table participants add column if not exists login_email text`);

  await pool.query(`
    create table if not exists email_verification_tokens (
      id bigserial primary key,
      user_id bigint not null references users(id) on delete cascade,
      token_hash text not null,
      created_at timestamptz not null default now(),
      expires_at timestamptz not null,
      used_at timestamptz
    )
  `);
  await pool.query(`create index if not exists idx_email_verification_tokens_user on email_verification_tokens(user_id)`);
  await pool.query(`create index if not exists idx_email_verification_tokens_hash on email_verification_tokens(token_hash)`);

  await pool.query(`update users set is_admin = true where role = 'admin' and is_admin = false`);
  await pool.query(`update users set role = 'admin' where is_admin = true and role <> 'admin'`);

  await pool.query(`
    update participants p
    set can_admin = (u.role = 'admin' or u.is_admin),
        login_email = u.email
    from users u
    where u.participant_id = p.id
  `);
}

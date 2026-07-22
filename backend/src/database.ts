import { readFile } from "node:fs/promises";
import bcrypt from "bcryptjs";
import pg from "pg";
import { config } from "./config";
import { isStrongPassword } from "./validation";

const { Pool } = pg;
export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.postgresTls ? { rejectUnauthorized: true } : false,
});

export async function ensureSchema(): Promise<void> {
  const schema = await readFile(
    new URL("../schema.sql", import.meta.url),
    "utf8",
  );
  await pool.query(schema);
}

export async function ensureBootstrapAdmin(): Promise<void> {
  if (!config.firstAdminEmail && !config.firstAdminPassword) return;
  if (!config.firstAdminEmail || !config.firstAdminPassword) {
    throw new Error(
      "FIRST_ADMIN_EMAIL and FIRST_ADMIN_PASSWORD must be set together",
    );
  }
  if (!isStrongPassword(config.firstAdminPassword)) {
    throw new Error("FIRST_ADMIN_PASSWORD does not meet the password policy");
  }
  const passwordHash = await bcrypt.hash(
    config.firstAdminPassword,
    config.bcryptRounds,
  );
  await pool.query(
    `insert into users (email, prenom, nom, password_hash, role, status, approved_at)
     values ($1, 'Admin', 'ClimbCrew', $2, 'admin', 'active', now())
     on conflict (email) do nothing`,
    [config.firstAdminEmail, passwordHash],
  );
}

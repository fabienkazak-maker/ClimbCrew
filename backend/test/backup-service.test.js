import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildBackupFilename, isSafeBackupFilename } from "../backup-service.js";

const backupSource = await readFile(new URL("../backup-service.js", import.meta.url), "utf8");

test("backup filename uses Paris-local timestamp and safe format", () => {
  const fileName = buildBackupFilename("manual", new Date("2026-08-17T10:20:30Z"));
  assert.equal(fileName, "climbcrew-manual-2026-08-17-122030.dump");
  assert.equal(isSafeBackupFilename(fileName), true);
});

test("backup filename validation blocks path traversal and foreign files", () => {
  assert.equal(isSafeBackupFilename("../../etc/passwd"), false);
  assert.equal(isSafeBackupFilename("climbcrew-manual-2026-08-17-122030.sql"), false);
  assert.equal(isSafeBackupFilename("climbcrew-pre-restore-2026-08-17-122030.dump"), true);
});

test("le destinataire de sauvegarde n'a aucune valeur implicite", () => {
  assert.match(backupSource, /process\.env\.BACKUP_RECIPIENT \|\| ""/);
  assert.doesNotMatch(backupSource, /cristal\.climbcrew@gmail\.com/);
  assert.match(backupSource, /assertBackupRecipientConfigured/);
  assert.match(backupSource, /emailConfigured: Boolean\(BACKUP_RECIPIENT\)/);
});

test("l'absence de destinataire n'empêche pas la sauvegarde locale", () => {
  assert.match(backupSource, /const backup = await createBackup\(\{ reason: "manual" \}\)/);
  assert.match(backupSource, /emailError: String\(error\.message \|\| error\)/);
  assert.match(backupSource, /local\.weekday === "Mon" && BACKUP_RECIPIENT/);
});

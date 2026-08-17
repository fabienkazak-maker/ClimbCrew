import test from "node:test";
import assert from "node:assert/strict";
import { buildBackupFilename, isSafeBackupFilename } from "../backup-service.js";

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

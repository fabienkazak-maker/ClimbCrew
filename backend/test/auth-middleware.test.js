import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../auth-middleware.js", import.meta.url), "utf8");

test("le middleware conserve la validation de session et le contrôle CSRF", () => {
  assert.match(source, /from user_sessions us/);
  assert.match(source, /join users u on u\.id = us\.user_id/);
  assert.match(source, /us\.revoked_at is null/);
  assert.match(source, /us\.expires_at > now\(\)/);
  assert.match(source, /session\.status !== "active"/);
  assert.match(source, /!isSafeMethod\(req\.method\)/);
  assert.match(source, /req\.headers\["x-csrf-token"\]/);
  assert.match(source, /constantTimeEqual\(csrfHeader, csrfCookie\)/);
  assert.match(source, /sessionId: session\.session_id/);
  assert.match(source, /user: serializeUser\(session\)/);
});

test("requireAdmin exige toujours le rôle admin", () => {
  assert.match(source, /req\.auth\?\.user\?\.role !== "admin"/);
  assert.match(source, /Accès administrateur requis/);
});

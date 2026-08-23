import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRateLimitLogDetails,
  describeRateLimit,
} from "../admin-users/rate-limit-log-integration.js";

test("les limites spécialisées sont identifiées dans les journaux", () => {
  assert.deepEqual(describeRateLimit("/auth/login"), {
    limiter: "auth",
    limit: 20,
    windowSeconds: 900,
    alsoSubjectToWriteLimit: true,
  });

  assert.deepEqual(describeRateLimit("/auth/forgot-password"), {
    limiter: "reset",
    limit: 10,
    windowSeconds: 3600,
    alsoSubjectToWriteLimit: true,
  });

  assert.deepEqual(describeRateLimit("/routes", { writeLimit: 77 }), {
    limiter: "write",
    limit: 77,
    windowSeconds: 60,
    alsoSubjectToWriteLimit: false,
  });
});

test("le détail journalisé ne conserve jamais la chaîne de requête", () => {
  const details = buildRateLimitLogDetails({
    method: "POST",
    url: "/auth/reset-password?token=secret-a-ne-pas-journaliser",
    requestId: "request-123",
  });

  assert.equal(details.limiter, "reset");
  assert.equal(details.path, "/auth/reset-password");
  assert.equal(details.method, "POST");
  assert.equal(details.requestId, "request-123");
  assert.doesNotMatch(JSON.stringify(details), /secret-a-ne-pas-journaliser/);
});

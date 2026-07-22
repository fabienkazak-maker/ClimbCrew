import { jsonRecord, stringField } from "./assertions";
import type { TestContext } from "./test-context";

function participant(passport: string, suffix: string) {
  return {
    nom: `Session-${suffix}`,
    prenom: "Test",
    passport,
    cotisation: true,
    ffme: true,
    canEncadrer: false,
    canReferer: false,
    canAdmin: false,
  };
}

async function createParticipant(
  context: TestContext,
  passport: string,
  suffix: string,
): Promise<string> {
  const response = await context.admin.request("/participants", {
    method: "POST",
    expected: 201,
    body: participant(passport, suffix),
  });
  return stringField(await jsonRecord(response), "id");
}

export async function runSessionSuite(context: TestContext): Promise<void> {
  const existingId = await createParticipant(context, "sans", "existing");
  const rejectedId = await createParticipant(context, "sans", "rejected");
  const eligibleId = await createParticipant(context, "jaune", "eligible");
  const sessionId = "api-session-midi";
  const session = {
    id: sessionId,
    date: "2026-08-05",
    slot: "midi",
    status: "encadree",
    encadrantId: null,
    referentId: null,
    participantIds: [existingId],
  };
  await context.user.request(`/sessions/${sessionId}`, {
    method: "PUT",
    body: session,
  });
  await context.user.request(`/sessions/${sessionId}`, {
    method: "PUT",
    body: { ...session, status: "libre" },
  });
  await context.user.request(`/sessions/${sessionId}`, {
    method: "PUT",
    expected: 400,
    body: {
      ...session,
      status: "libre",
      participantIds: [existingId, rejectedId],
    },
  });
  await context.user.request(`/sessions/${sessionId}`, {
    method: "PUT",
    body: {
      ...session,
      status: "libre",
      participantIds: [existingId, eligibleId],
    },
  });
  await context.user.request(`/sessions/${sessionId}`, {
    method: "DELETE",
    expected: 403,
  });
  await context.admin.request("/sessions/invalid", {
    method: "PUT",
    expected: 400,
    body: { ...session, slot: "nuit" },
  });
  const capacityIds: string[] = [];
  for (let index = 0; index < 19; index += 1) {
    capacityIds.push(
      await createParticipant(context, "orange", `capacity-${index}`),
    );
  }
  await context.admin.request("/sessions/api-session-capacity", {
    method: "PUT",
    expected: 400,
    body: {
      ...session,
      id: "api-session-capacity",
      status: "encadree",
      participantIds: capacityIds,
    },
  });
  await context.admin.request(`/sessions/${sessionId}`, {
    method: "DELETE",
    expected: 204,
  });
  for (const id of [existingId, rejectedId, eligibleId, ...capacityIds]) {
    await context.admin.request(`/participants/${id}`, {
      method: "DELETE",
      expected: 204,
    });
  }
}

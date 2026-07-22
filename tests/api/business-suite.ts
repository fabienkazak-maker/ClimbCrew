import { randomUUID } from "node:crypto";
import { ApiClient } from "./api-client";
import {
  assert,
  findRecord,
  jsonArray,
  jsonRecord,
  stringField,
} from "./assertions";
import type { TestContext } from "./test-context";

function participant(suffix: string) {
  return {
    nom: `Participant-${suffix}`,
    prenom: "Test",
    passport: "orange",
    cotisation: true,
    ffme: true,
    canEncadrer: false,
    canReferer: false,
    canAdmin: false,
  };
}

export async function runBusinessSuite(context: TestContext): Promise<void> {
  const anonymous = new ApiClient(context.baseUrl);
  await anonymous.request("/participants", { expected: 401 });
  await context.user.request("/participants");
  await context.user.request("/participants", {
    method: "POST",
    expected: 403,
    body: participant("forbidden"),
  });
  const created = await jsonRecord(
    await context.admin.request("/participants", {
      method: "POST",
      expected: 201,
      body: participant("created"),
    }),
  );
  const participantId = stringField(created, "id");
  const updatedParticipant = {
    ...participant("updated"),
    id: participantId,
    passport: "bleu",
    canEncadrer: true,
    canReferer: true,
    canAdmin: true,
  };
  const updated = await jsonRecord(
    await context.admin.request(`/participants/${participantId}`, {
      method: "PUT",
      body: updatedParticipant,
    }),
  );
  assert(updated.passport === "bleu", "Mise à jour participant invalide");
  const routeId = `route-${randomUUID()}`;
  await context.user.request("/routes", {
    method: "POST",
    expected: 403,
    body: {},
  });
  const route = await jsonRecord(
    await context.admin.request("/routes", {
      method: "POST",
      expected: 201,
      body: {
        id: routeId,
        numeroVoieUnique: `T-${randomUUID()}`,
        numeroCorde: 1,
        couleurPrises: "rouge",
        cotationReference: "6a",
        cotationAjustee: "6a",
        nomVoie: "Voie API",
        nomOuvreur: "Test",
        moulinetteOnly: true,
        active: true,
        dateCreation: "2026-08-04",
      },
    }),
  );
  assert(stringField(route, "id") === routeId, "Création voie invalide");
  const updatedRoute = await jsonRecord(
    await context.admin.request(`/routes/${routeId}`, {
      method: "PUT",
      body: { ...route, active: false, cotationAjustee: "6a+" },
    }),
  );
  assert(updatedRoute.active === false, "Archivage voie invalide");
  const importedParticipants = await jsonArray(
    await context.admin.request("/participants"),
  );
  const referent = findRecord(importedParticipants, "nom", "Referent");
  const achievementId = `achievement-${randomUUID()}`;
  const achievement = {
    id: achievementId,
    participantId: stringField(referent, "id"),
    sessionId: "import-matin",
    voieId: routeId,
    dateRealisation: "2026-08-04",
    styleRealisation: "flash",
    commentaire: "Création API",
    cotationProposee: "6a",
    nbEssais: 1,
  };
  await context.user.request("/realisations", {
    method: "POST",
    expected: 201,
    body: achievement,
  });
  await context.user.request(`/realisations/${achievementId}`, {
    method: "PUT",
    body: { ...achievement, commentaire: "Modification API", nbEssais: 2 },
  });
  const achievements = await jsonArray(
    await context.user.request("/realisations"),
  );
  assert(
    Boolean(
      findRecord(achievements, "id", achievementId).commentaire ===
        "Modification API",
    ),
    "Mise à jour réalisation invalide",
  );
  await context.user.request(`/realisations/${achievementId}`, {
    method: "DELETE",
    expected: 204,
  });
  await context.admin.request(`/participants/${participantId}`, {
    method: "DELETE",
    expected: 204,
  });
}

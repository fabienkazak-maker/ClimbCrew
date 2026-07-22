import { ApiClient } from "./api-client";
import { arrayField, assert, jsonArray, jsonRecord } from "./assertions";
import type { TestContext } from "./test-context";

function dataset() {
  return {
    exportedAt: null,
    version: "test",
    participants: [
      {
        id: "source-encadrant",
        nom: "Encadrant",
        prenom: "Test",
        passport: "orange",
        cotisation: true,
        ffme: true,
        canEncadrer: true,
        canReferer: false,
        canAdmin: false,
      },
      {
        id: "source-referent",
        nom: "Referent",
        prenom: "Test",
        passport: "vert",
        cotisation: true,
        ffme: true,
        canEncadrer: false,
        canReferer: true,
        canAdmin: false,
      },
    ],
    sessions: [
      {
        id: "import-matin",
        date: "2026-08-03",
        slot: "matin",
        status: "encadree",
        encadrantId: "source-encadrant",
        referentId: null,
        participantIds: ["source-referent"],
      },
      {
        id: "import-midi",
        date: "2026-08-03",
        slot: "midi",
        status: "libre",
        encadrantId: null,
        referentId: "source-referent",
        participantIds: ["source-encadrant"],
      },
      {
        id: "import-soir",
        date: "2026-08-03",
        slot: "soir",
        status: "fermee",
        encadrantId: null,
        referentId: null,
        participantIds: [],
      },
    ],
    ropes: [{ numeroCorde: 1, actif: true, couleurCorde: "bleue" }],
    routes: [
      {
        id: "route-importee",
        numeroVoieUnique: "T-001",
        numeroCorde: 1,
        couleurPrises: "bleu",
        cotationReference: "5c",
        cotationAjustee: "5c",
        nomVoie: "Voie test",
        nomOuvreur: "Test",
        moulinetteOnly: false,
        active: true,
        dateCreation: "2026-08-01",
      },
    ],
    realisations: [
      {
        id: "achievement-imported",
        participantId: "source-referent",
        sessionId: "import-matin",
        voieId: "route-importee",
        dateRealisation: "2026-08-03",
        styleRealisation: "flash",
        commentaire: "Test",
        cotationProposee: "5c",
        nbEssais: 1,
      },
    ],
  };
}

export async function runTransferSuite(context: TestContext): Promise<void> {
  await context.user.request("/admin/export-data", { expected: 403 });
  await context.user.request("/admin/import-data", {
    method: "POST",
    expected: 403,
    body: dataset(),
  });
  await context.admin.request("/admin/import-data", {
    method: "POST",
    expected: 422,
    body: { participants: [] },
  });
  const setup = new ApiClient(context.baseUrl);
  await setup.request("/setup/import-data", {
    method: "POST",
    expected: 403,
    headers: { "X-Setup-Token": "incorrect" },
    body: dataset(),
  });
  await setup.request("/setup/import-data", {
    method: "POST",
    headers: { "X-Setup-Token": context.setupToken },
    body: dataset(),
  });
  assert(
    (await jsonArray(await context.admin.request("/participants"))).length ===
      2,
    "Import participants incomplet",
  );
  assert(
    (await jsonArray(await context.admin.request("/sessions"))).length === 3,
    "Import séances incomplet",
  );
  assert(
    (await jsonArray(await context.admin.request("/ropes"))).length === 1,
    "Import cordes incomplet",
  );
  assert(
    (await jsonArray(await context.admin.request("/routes"))).length === 1,
    "Import voies incomplet",
  );
  assert(
    (await jsonArray(await context.admin.request("/realisations"))).length ===
      1,
    "Import réalisations incomplet",
  );
  const exported = await jsonRecord(
    await context.admin.request("/admin/export-data"),
  );
  assert(
    arrayField(exported, "participants").length === 2,
    "Export participants invalide",
  );
  assert(
    arrayField(exported, "sessions").length === 3,
    "Export séances invalide",
  );
  assert(arrayField(exported, "routes").length === 1, "Export voies invalide");
  await context.admin.request("/api/import-data", {
    method: "POST",
    body: { data: exported },
  });
}

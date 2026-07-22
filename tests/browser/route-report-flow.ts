import { expect, type Page } from "@playwright/test";
import { openTab } from "./browser-helpers";
import type { ParticipantFixture } from "./participant-session-flow";

export async function runRouteReportFlow(
  page: Page,
  fixture: ParticipantFixture,
  suffix: string,
): Promise<void> {
  const routeName = `Route-${suffix}`;
  const routeNumber = `UI-${suffix}`;
  await openTab(page, "Voies");
  const addSection = page.locator(".card").filter({
    has: page.getByRole("heading", { name: "Ajouter une voie" }),
  });
  await addSection.getByLabel("Numéro unique").fill(routeNumber);
  await addSection.getByLabel("Couleur").fill("rouge");
  await addSection.getByLabel("Cotation").selectOption("6a");
  await addSection.getByLabel("Nom", { exact: true }).fill(routeName);
  await addSection.getByLabel("Ouvreur").fill("Browser");
  await addSection.getByLabel("Moulinette uniquement").check();
  await addSection.getByRole("button", { name: "Ajouter" }).click();
  const routeCard = page.locator(".route-card").filter({ hasText: routeName });
  await expect(routeCard).toBeVisible();
  await routeCard.getByRole("button", { name: "Réalisation" }).click();
  const dialog = page.getByRole("dialog");
  const daySelect = dialog.getByLabel("Jour");
  await daySelect.selectOption(fixture.sessionDate);
  await dialog
    .getByLabel("Participant")
    .selectOption({ label: fixture.eligibleName });
  await dialog.getByLabel("Style").selectOption("flash");
  await dialog.getByLabel("Cotation proposée").selectOption("6a");
  await dialog.getByLabel("Nombre d’essais").fill("1");
  await dialog.getByLabel("Commentaire").fill("Réalisation navigateur");
  await dialog.getByRole("button", { name: "Enregistrer" }).click();
  await expect(dialog).toHaveCount(0);
  await openTab(page, "Progression");
  await page
    .getByLabel("Participant")
    .selectOption({ label: fixture.eligibleName });
  await expect(
    page.locator(".stat").filter({ hasText: "Réalisations" }),
  ).toContainText("1");
  await expect(page.getByText("Réalisation navigateur")).toBeVisible();
  await openTab(page, "Statistiques");
  await expect(page.getByText(fixture.eligibleName)).toBeVisible();
  await page.locator(".card select").selectOption("participations");
  await page.getByRole("button", { name: "Croissant" }).click();
  await openTab(page, "FAQ");
  await expect(page.getByText(/90 derniers jours/)).toBeVisible();
  await openTab(page, "Voies");
  await routeCard.getByRole("button", { name: "Archiver" }).click();
  await expect(routeCard).toContainText("Archivée");
}

export async function runTransferUiFlow(
  page: Page,
  fixture: ParticipantFixture,
): Promise<void> {
  await openTab(page, "Administration");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporter" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("climbcrew-export.json");
  const path = await download.path();
  if (!path) throw new Error("Export navigateur absent");
  await page.locator('input[type="file"]').setInputFiles(path);
  await expect(page.getByText("Import terminé.")).toBeVisible();
  for (const name of [fixture.eligibleName, fixture.ineligibleName]) {
    const row = page
      .locator(".participant-admin-row")
      .filter({ has: page.getByText(name, { exact: true }) });
    await row.getByRole("button", { name: "Supprimer" }).click();
    await expect(row).toHaveCount(0);
  }
}

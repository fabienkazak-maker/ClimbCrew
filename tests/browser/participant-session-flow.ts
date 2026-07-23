import { expect, type Page } from "@playwright/test";
import { openTab } from "./browser-helpers";

export interface ParticipantFixture {
  eligibleName: string;
  ineligibleName: string;
  sessionDate: string;
}

async function addParticipant(
  page: Page,
  nom: string,
  passport: string,
): Promise<void> {
  const section = page.locator(".card").filter({
    has: page.getByRole("heading", { name: "Ajouter un participant" }),
  });
  await section.getByLabel("Nom", { exact: true }).fill(nom);
  await section.getByLabel("Prénom").fill("Browser");
  await section.getByLabel("Passeport").fill(passport);
  await section.getByLabel("Cotisation").check();
  await section.getByLabel("Licence FFME").check();
  await section.getByRole("button", { name: "Ajouter" }).click();
  await expect(page.getByText("Participant ajouté.")).toBeVisible();
}

export async function runParticipantSessionFlow(
  page: Page,
  suffix: string,
): Promise<ParticipantFixture> {
  const eligibleNom = `Eligible-${suffix}`;
  const ineligibleNom = `Restricted-${suffix}`;
  const eligibleName = `${eligibleNom} Browser`;
  const ineligibleName = `${ineligibleNom} Browser`;
  await openTab(page, "Administration");
  await addParticipant(page, eligibleNom, "orange");
  await addParticipant(page, ineligibleNom, "sans");
  const eligibleRow = page
    .locator(".participant-admin-row")
    .filter({ has: page.getByText(eligibleName, { exact: true }) });
  await eligibleRow.getByRole("button", { name: "Modifier" }).click();
  const editingRow = page.locator(".participant-admin-row").filter({
    has: page.locator(`input[value="${eligibleNom}"]`),
  });
  await editingRow.getByLabel("Encadrant").check();
  await editingRow.getByLabel("Référent").check();
  await editingRow.getByRole("button", { name: "Enregistrer" }).click();
  await expect(eligibleRow).toContainText("Passeport orange");
  await openTab(page, "Inscriptions");
  const sessionCard = page.locator(".session-card").filter({
    has: page.getByRole("heading", { name: "Séance matin" }),
  });
  await sessionCard.getByLabel("Statut").selectOption("libre");
  const ineligibleOption = sessionCard
    .getByLabel("Ajouter un inscrit")
    .locator("option")
    .filter({ hasText: ineligibleName });
  await expect(ineligibleOption).toHaveAttribute("disabled", "");
  await sessionCard
    .getByLabel("Ajouter un inscrit")
    .selectOption({ label: eligibleName });
  await expect(sessionCard).toContainText(eligibleName);
  await sessionCard.getByLabel("Statut").selectOption("encadree");
  await sessionCard
    .getByLabel("Encadrant", { exact: true })
    .selectOption({ label: eligibleName });
  await sessionCard
    .getByRole("button", { name: `Retirer ${eligibleName}` })
    .click();
  await expect(
    sessionCard.getByRole("button", { name: `Retirer ${eligibleName}` }),
  ).toHaveCount(0);
  await sessionCard
    .getByLabel("Ajouter un inscrit")
    .selectOption({ label: eligibleName });
  await page.getByRole("button", { name: "Semaine" }).click();
  await expect(page.locator(".week-grid")).toBeVisible();
  await page.getByRole("button", { name: "Jour" }).click();
  await page.getByRole("button", { name: "Suivant" }).click();
  await page.getByRole("button", { name: "Précédent" }).click();
  const sessionDate = await page.evaluate(() => {
    const date = new Date();
    if (date.getDay() === 6) date.setDate(date.getDate() + 2);
    if (date.getDay() === 0) date.setDate(date.getDate() + 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  return { eligibleName, ineligibleName, sessionDate };
}

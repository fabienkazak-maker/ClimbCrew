import { expect, test } from "@playwright/test";

test("connexion, session et navigation métier en préproduction", async ({ page }) => {
  const email = process.env.CLIMBCREW_TEST_EMAIL;
  const password = process.env.CLIMBCREW_TEST_PASSWORD;
  if (!email || !password) {
    throw new Error("Configurer CLIMBCREW_TEST_EMAIL et CLIMBCREW_TEST_PASSWORD dans les secrets GitHub.");
  }

  const browserErrors = [];
  const serverErrors = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("response", (response) => {
    if (response.url().startsWith("https://pre-climbcrew.dip-tcs.com/api/") && response.status() >= 500) {
      serverErrors.push(`${response.status()} ${new URL(response.url()).pathname}`);
    }
  });

  await test.step("Se connecter", async () => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Se connecter" })).toBeVisible();
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Mot de passe", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page.locator(".app")).toBeVisible({ timeout: 20_000 });
  });

  await test.step("Conserver la session après rechargement", async () => {
    await page.reload();
    await expect(page.locator(".app")).toBeVisible({ timeout: 20_000 });
  });

  const sections = [
    "Planning",
    "Voies",
    "Profil",
    "Chat",
    "Statistiques",
    "Tableau d’honneur",
    "FAQ",
  ];

  for (const label of sections) {
    await test.step(`Ouvrir ${label}`, async () => {
      await page.getByRole("button", { name: "Afficher le menu" }).click();
      const sidebar = page.locator('aside[aria-label="Navigation CristalClimbClub"]');
      await expect(sidebar).toHaveClass(/open/);
      await sidebar.getByRole("button", { name: label, exact: true }).click();
      await expect(page.locator(".topbar .brand p")).toHaveText(label);
      await expect(page.locator(".app")).toBeVisible();
    });
  }

  expect(browserErrors, "Erreurs JavaScript lors des parcours").toEqual([]);
  expect(serverErrors, "Erreurs serveur lors des parcours").toEqual([]);
});

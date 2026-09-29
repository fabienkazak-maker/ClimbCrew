import { expect, test } from "@playwright/test";

test("connexion et restauration de la session en préproduction", async ({ page }) => {
  const email = process.env.CLIMBCREW_TEST_EMAIL;
  const password = process.env.CLIMBCREW_TEST_PASSWORD;
  if (!email || !password) {
    throw new Error("Configurer CLIMBCREW_TEST_EMAIL et CLIMBCREW_TEST_PASSWORD dans les secrets GitHub.");
  }

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Se connecter" })).toBeVisible();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.locator(".app")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("navigation", { name: "Navigation CristalClimbClub" })).toBeVisible();

  await page.reload();
  await expect(page.locator(".app")).toBeVisible({ timeout: 20_000 });
});

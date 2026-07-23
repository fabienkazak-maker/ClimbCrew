import { randomUUID } from "node:crypto";
import { expect, type Page } from "@playwright/test";
import type { BrowserAccount } from "./auth-flow";
import { loginAsAdmin } from "./auth-flow";
import { login, logout, openTab } from "./browser-helpers";

function accountCard(page: Page, email: string) {
  return page.locator(".subcard").filter({ hasText: email });
}

export async function runAccountFlow(
  page: Page,
  account: BrowserAccount,
): Promise<void> {
  await loginAsAdmin(page);
  await openTab(page, "Gestion des comptes");
  const card = accountCard(page, account.email);
  await expect(card).toContainText("pending");
  await card.getByRole("button", { name: "Approuver" }).click();
  await expect(card).toContainText("active");
  await card.getByRole("button", { name: "Code temporaire" }).click();
  const codeText = page.getByText(/Code temporaire:/);
  await expect(codeText).toBeVisible();
  const content = await codeText.textContent();
  const resetToken = content?.match(/Code temporaire:\s*([^\s·]+)/)?.[1];
  if (!resetToken) throw new Error("Code temporaire introuvable");
  await logout(page);
  const nextPassword = `Ee5!${randomUUID()}`;
  await page.getByRole("button", { name: "Réinitialiser" }).click();
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Code").fill(resetToken);
  await page.getByLabel("Nouveau mot de passe").fill(nextPassword);
  await page.getByLabel("Confirmation").fill(nextPassword);
  await page.getByRole("button", { name: "Mettre à jour" }).click();
  await expect(page.getByText("Mot de passe mis à jour.")).toBeVisible();
  await login(page, account.email, nextPassword);
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(
    page.getByRole("button", { name: "Administration", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Déconnexion" }).click();
  await expect(
    page.getByRole("button", { name: "Se connecter" }),
  ).toBeVisible();
  await loginAsAdmin(page);
  await openTab(page, "Gestion des comptes");
  await accountCard(page, account.email)
    .getByRole("button", { name: "Révoquer" })
    .click();
  await expect(accountCard(page, account.email)).toContainText("revoked");
  await accountCard(page, account.email)
    .getByRole("button", { name: "Réactiver" })
    .click();
  await expect(accountCard(page, account.email)).toContainText("active");
  await openTab(page, "Logs");
  await expect(
    page.getByRole("heading", { name: "Journal des accès" }),
  ).toBeVisible();
  await expect(page.locator(".subcard").first()).toBeVisible();
}

import { randomUUID } from "node:crypto";
import { expect, type Page } from "@playwright/test";
import type { BrowserMonitor } from "./browser-helpers";
import { login } from "./browser-helpers";

export interface BrowserAccount {
  email: string;
  password: string;
}

export async function runAnonymousFlows(
  page: Page,
  monitor: BrowserMonitor,
  projectName: string,
): Promise<BrowserAccount> {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "ClimbCrew" })).toBeVisible();
  await page.getByLabel("Email").fill("absent@example.invalid");
  await page.getByLabel("Mot de passe").fill("incorrect");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByText("Identifiants invalides")).toBeVisible();
  monitor.consoleErrors.length = 0;
  await page.getByRole("button", { name: "Mot de passe perdu" }).click();
  await page.getByLabel("Email").fill("absent@example.invalid");
  await page
    .getByRole("button", { name: "Signaler la perte du mot de passe" })
    .click();
  await expect(page.getByText("Demande enregistrée.")).toBeVisible();
  const suffix = `${projectName}-${randomUUID()}`.replaceAll("_", "-");
  const account = {
    email: `${suffix}@example.invalid`,
    password: `Dd4!${randomUUID()}`,
  };
  await page.getByRole("button", { name: "Demander un accès" }).click();
  await page.getByLabel("Prénom").fill("Browser");
  await page.getByLabel("Nom", { exact: true }).fill(projectName);
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(account.password);
  await page.getByLabel("Confirmation").fill(account.password);
  await page.getByLabel(/J’accepte/).check();
  await page.getByRole("button", { name: "Envoyer la demande" }).click();
  await expect(page.getByText(/Demande envoyée/)).toBeVisible();
  return account;
}

export async function loginAsAdmin(page: Page): Promise<void> {
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Compte administrateur absent");
  await login(page, email, password);
}

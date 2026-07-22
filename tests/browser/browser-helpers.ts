import { expect, type Page } from "@playwright/test";

export interface BrowserMonitor {
  consoleErrors: string[];
  failedRequests: string[];
  serverErrors: string[];
}

export function monitorBrowser(page: Page): BrowserMonitor {
  const successfulResponses = new Set<string>();
  const state: BrowserMonitor = {
    consoleErrors: [],
    failedRequests: [],
    serverErrors: [],
  };
  page.on("console", (message) => {
    if (message.type() === "error") state.consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    const key = `${request.method()} ${request.url()}`;
    if (successfulResponses.has(key)) return;
    const reason = request.failure()?.errorText ?? "raison absente";
    state.failedRequests.push(`${key} ${reason}`);
  });
  page.on("response", (response) => {
    if (response.ok()) {
      const request = response.request();
      successfulResponses.add(`${request.method()} ${response.url()}`);
    }
    if (response.status() >= 500) {
      state.serverErrors.push(`${response.status()} ${response.url()}`);
    }
  });
  return state;
}

export async function login(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.getByRole("button", { name: "Connexion", exact: true }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.locator(".hero")).toBeVisible();
  await expect(page.getByText(/API connectée/)).toBeVisible();
}

export async function openTab(page: Page, name: string): Promise<void> {
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("button", { name, exact: true }).click();
}

export async function logout(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("button", { name: "Déconnexion" }).click();
  await expect(
    page.getByRole("button", { name: "Se connecter" }),
  ).toBeVisible();
}

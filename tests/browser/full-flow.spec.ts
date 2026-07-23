import { expect, test } from "@playwright/test";
import { runAccountFlow } from "./account-flow";
import { runAnonymousFlows } from "./auth-flow";
import { monitorBrowser } from "./browser-helpers";
import { runParticipantSessionFlow } from "./participant-session-flow";
import { runRouteReportFlow, runTransferUiFlow } from "./route-report-flow";

test("parcours fonctionnel complet", async ({ page }, testInfo) => {
  const monitor = monitorBrowser(page);
  const suffix = testInfo.project.name.replaceAll(/[^a-z0-9]/g, "-");
  const account = await runAnonymousFlows(page, monitor, testInfo.project.name);
  await runAccountFlow(page, account);
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByLabel("Thème").selectOption("light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.locator(".sidebar .ghost").click();
  const fixture = await runParticipantSessionFlow(page, suffix);
  await runRouteReportFlow(page, fixture, suffix);
  await runTransferUiFlow(page, fixture);
  const horizontalOverflow = await page
    .locator("body *")
    .evaluateAll((elements) =>
      elements.flatMap((element) => {
        const rectangle = element.getBoundingClientRect();
        if (rectangle.right <= window.innerWidth + 1) return [];
        const classes = Array.from(element.classList).join(".");
        const content = element.textContent?.trim().slice(0, 40) ?? "";
        return [
          `${element.tagName.toLowerCase()}.${classes}[${content}]:${Math.round(rectangle.right)}`,
        ];
      }),
    );
  expect(horizontalOverflow).toEqual([]);
  const storageKeys = await page.evaluate(() => Object.keys(localStorage));
  expect(storageKeys).not.toContain("climbcrew_auth_token");
  expect(storageKeys).not.toContain("climbcrew_local_data_v2");
  const readableCookies = await page.evaluate(() => document.cookie);
  expect(readableCookies).toContain("climbcrew_csrf=");
  expect(readableCookies).not.toContain("climbcrew_session=");
  await expect(page.locator(".hero")).toBeVisible();
  expect(monitor.consoleErrors).toEqual([]);
  expect(monitor.failedRequests).toEqual([]);
  expect(monitor.serverErrors).toEqual([]);
});

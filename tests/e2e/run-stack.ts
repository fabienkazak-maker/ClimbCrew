import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";

const suffix = randomBytes(5).toString("hex");
const project = `climbcrew-test-${suffix}`;
const browserProject = process.env.TEST_BROWSER_PROJECT;
const environment = {
  ...process.env,
  TEST_ADMIN_EMAIL: `admin-${suffix}@example.invalid`,
  TEST_ADMIN_PASSWORD: `Aa1!${randomBytes(18).toString("hex")}`,
  TEST_DB_PASSWORD: randomBytes(24).toString("hex"),
  TEST_SETUP_TOKEN: randomBytes(32).toString("hex"),
  TEST_BACKEND_PORT: process.env.TEST_BACKEND_PORT ?? "39100",
  TEST_FRONTEND_PORT: process.env.TEST_FRONTEND_PORT ?? "39180",
};

function run(command: string, args: string[]): void {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: environment,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`${command} a échoué avec le statut ${result.status}`);
  }
}

const compose = ["compose", "-p", project, "-f", "docker-compose.test.yml"];

async function waitForFrontend(): Promise<void> {
  const url = `http://127.0.0.1:${environment.TEST_FRONTEND_PORT}`;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
  }
  throw new Error("La pile de test ne répond pas");
}

try {
  run("docker", [...compose, "up", "-d", "--build", "--wait"]);
  await waitForFrontend();
  run("bun", ["tests/api/run-api-suite.ts"]);
  const browserArguments = ["x", "playwright", "test"];
  if (browserProject) {
    browserArguments.push(`--project=${browserProject}`);
  }
  run("bun", browserArguments);
} finally {
  run("docker", [...compose, "down", "-v", "--remove-orphans"]);
}

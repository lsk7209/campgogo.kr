import { spawn, type ChildProcess } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
const PORT = process.env.SEO_PORT ?? "43134";
const BASE_URL = `http://127.0.0.1:${PORT}`;
const LOCAL_CRON_SECRET = "codex-local-http-verifier";
const HOLD_SERVER_MS = Number(process.env.SEO_HOLD_SERVER_MS ?? "0");
const configuredChildTimeout = Number(process.env.SEO_CHILD_TIMEOUT_MS ?? "180000");
const CHILD_TIMEOUT_MS = Number.isFinite(configuredChildTimeout) && configuredChildTimeout > 0
  ? configuredChildTimeout
  : 180_000;
const REQUIRED_ENV = ["TURSO_DATABASE_URL", "TURSO_AUTH_TOKEN"] as const;

function parseDotEnv(path: string): Record<string, string> {
  const values: Record<string, string> = {};

  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;

    let value = match[2].trim();
    if (
      value.length >= 2
      && ((value.startsWith('"') && value.endsWith('"'))
        || (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }

  return values;
}

function verificationEnv(): NodeJS.ProcessEnv {
  const sourceFile = process.env.SEO_SOURCE_ENV_FILE;
  const sourceValues = sourceFile ? parseDotEnv(sourceFile) : {};
  const env: NodeJS.ProcessEnv = { ...process.env };

  for (const key of REQUIRED_ENV) {
    const value = sourceValues[key] ?? process.env[key];
    if (!value) throw new Error(`${key} is required for the real-data HTTP verification`);
    env[key] = value;
  }

  env.NEXT_PUBLIC_SITE_URL = "https://campgogo.kr";
  env.SITE_URL = "https://campgogo.kr";
  env.CRON_SECRET = LOCAL_CRON_SECRET;
  env.SEO_BASE_URL = BASE_URL;
  env.SEO_CRON_SECRET = LOCAL_CRON_SECRET;
  env.ADMIN_API_TOKEN = "codex-local-admin-verifier";
  env.SEO_ADMIN_TOKEN = "codex-local-admin-verifier";
  delete env.SEO_SOURCE_ENV_FILE;
  return env;
}

async function waitUntilReady(server: ReturnType<typeof spawn>): Promise<void> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (hasExited(server)) {
      throw new Error(`Next server exited before verification (code ${server.exitCode})`);
    }

    try {
      const response = await fetch(`${BASE_URL}/robots.txt`, {
        signal: AbortSignal.timeout(2_000),
      });
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }

    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }

  throw new Error(`Next server did not become ready at ${BASE_URL}`);
}

function hasExited(child: ChildProcess): boolean {
  return child.exitCode !== null || child.signalCode !== null;
}

async function waitForExit(child: ChildProcess, timeoutMs = CHILD_TIMEOUT_MS): Promise<number> {
  if (hasExited(child)) return child.exitCode ?? 1;

  return await new Promise((resolveExit, rejectExit) => {
    const timeout = setTimeout(() => {
      cleanup();
      rejectExit(new Error(`Child process did not exit within ${timeoutMs}ms`));
    }, timeoutMs);
    const cleanup = () => {
      clearTimeout(timeout);
      child.off("error", onError);
      child.off("exit", onExit);
    };
    const onError = (error: Error) => {
      cleanup();
      rejectExit(error);
    };
    const onExit = (code: number | null) => {
      cleanup();
      resolveExit(code ?? 1);
    };
    child.once("error", onError);
    child.once("exit", onExit);
  });
}

async function terminate(child: ChildProcess, label: string): Promise<void> {
  if (hasExited(child)) return;
  child.kill();
  try {
    await waitForExit(child, 5_000);
  } catch {
    if (!hasExited(child)) child.kill("SIGKILL");
    try {
      await waitForExit(child, 5_000);
    } catch {
      throw new Error(`${label} could not be terminated cleanly`);
    }
  }
}

async function main(): Promise<void> {
  const env = verificationEnv();
  const nextBin = resolve(ROOT, "node_modules/next/dist/bin/next");
  const tsxBin = resolve(ROOT, "node_modules/tsx/dist/cli.mjs");
  const verifier = resolve(ROOT, "scripts/verify-seo-http.ts");
  const server = spawn(process.execPath, [nextBin, "start", "-p", PORT], {
    cwd: ROOT,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  server.stdout?.on("data", (chunk) => process.stdout.write(chunk));
  server.stderr?.on("data", (chunk) => process.stderr.write(chunk));

  let verifierProcess: ChildProcess | undefined;
  try {
    await waitUntilReady(server);
    verifierProcess = spawn(process.execPath, [tsxBin, verifier], {
      cwd: ROOT,
      env,
      stdio: "inherit",
      windowsHide: true,
    });
    const exitCode = await waitForExit(verifierProcess);
    if (exitCode !== 0) throw new Error(`HTTP verifier exited with code ${exitCode}`);
    if (Number.isFinite(HOLD_SERVER_MS) && HOLD_SERVER_MS > 0) {
      console.log(`Holding verification server at ${BASE_URL} for ${HOLD_SERVER_MS}ms`);
      await new Promise((resolveHold) => setTimeout(resolveHold, Math.min(HOLD_SERVER_MS, 300_000)));
    }
  } finally {
    if (verifierProcess && !hasExited(verifierProcess)) await terminate(verifierProcess, "HTTP verifier");
    await terminate(server, "Next verification server");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

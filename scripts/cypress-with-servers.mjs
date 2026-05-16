/**
 * Sobe API (3000) + Vite dev (5173) e executa `cypress open` ou `cypress run`.
 * Uso: node scripts/cypress-with-servers.mjs [open|run] [...args extra do Cypress]
 */
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import treeKill from "tree-kill";
import killPort from "kill-port";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const frontend = path.join(root, "frontend");
const mode = process.argv[2] === "run" ? "run" : "open";
const cypressExtra = process.argv.slice(3);

function npmRun(script, extraEnv = {}) {
  return spawn("npm", ["run", script], {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...extraEnv },
  });
}

async function waitOk(url, label, timeoutMs = 90000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* aguarda */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Timeout aguardando ${label}: ${url}`);
}

function killTree(proc) {
  return new Promise((resolve) => {
    if (!proc?.pid) return resolve();
    treeKill(proc.pid, "SIGTERM", () => resolve());
  });
}

function assertKeepsRunning(proc, name, graceMs = 2500) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, graceMs);
    proc.once("exit", (code) => {
      clearTimeout(timer);
      if (code !== 0 && code !== null) {
        reject(
          new Error(
            `${name} não subiu (código ${code}). Libere as portas 3000 e 5173 e tente de novo.`
          )
        );
      } else {
        resolve();
      }
    });
  });
}

let apiProc;
let feProc;

try {
  await Promise.all([killPort(3000), killPort(5173)]);
  await new Promise((r) => setTimeout(r, 400));

  apiProc = npmRun("backend:start");
  await assertKeepsRunning(apiProc, "API");
  await waitOk("http://127.0.0.1:3000/health", "API");

  feProc = npmRun("frontend:dev");
  await assertKeepsRunning(feProc, "Vite (dev)");
  await waitOk("http://127.0.0.1:5173/", "Vite dev");

  const cy = spawn(
    "npx",
    ["cypress", mode, ...cypressExtra],
    {
      cwd: frontend,
      stdio: "inherit",
      shell: true,
      env: { ...process.env },
    }
  );
  const code = await new Promise((resolve) => cy.on("exit", resolve));
  process.exitCode = code === null ? 1 : code;
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  await killTree(feProc);
  await killTree(apiProc);
}

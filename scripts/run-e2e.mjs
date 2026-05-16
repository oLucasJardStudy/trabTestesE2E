import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import treeKill from "tree-kill";
import killPort from "kill-port";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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

/** Falha se o processo encerrar com código de erro nos primeiros ms. */
function assertKeepsRunning(proc, name, graceMs = 2500) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, graceMs);
    proc.once("exit", (code) => {
      clearTimeout(timer);
      if (code !== 0 && code !== null) {
        reject(
          new Error(
            `${name} não subiu (código ${code}). Libere as portas 3000 e 4173 e tente de novo.`
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
  await Promise.all([killPort(3000), killPort(4173)]);
  await new Promise((r) => setTimeout(r, 400));

  apiProc = npmRun("backend:start");
  await assertKeepsRunning(apiProc, "API");
  await waitOk("http://127.0.0.1:3000/health", "API");

  feProc = npmRun("frontend:preview");
  await assertKeepsRunning(feProc, "Frontend preview");
  await waitOk("http://127.0.0.1:4173/", "frontend preview");

  const cy = npmRun("cypress:run", {
    CYPRESS_BASE_URL: "http://127.0.0.1:4173",
  });
  const code = await new Promise((resolve) => cy.on("exit", resolve));
  process.exitCode = code === null ? 1 : code;
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  await killTree(feProc);
  await killTree(apiProc);
}

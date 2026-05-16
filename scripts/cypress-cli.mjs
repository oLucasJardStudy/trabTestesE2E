/**
 * Encaminha `npm run cypress`, `npm run cypress open` e `npm run cypress run`.
 * Com `open` (ou sem argumentos), sobe API + Vite na 5173 antes do Cypress (evita ECONNREFUSED).
 * Com `run`, faz o mesmo salvo se `CYPRESS_BASE_URL` apontar para 4173 (ex.: chamado por outro orquestrador).
 */
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const frontend = path.join(root, "frontend");
const withServersScript = path.join(root, "scripts", "cypress-with-servers.mjs");
const extra = process.argv.slice(2);
const first = extra[0];

const baseIs4173 = process.env.CYPRESS_BASE_URL?.includes("4173");

function spawnCypressDirect(cypressArgs) {
  const child = spawn("npx", ["cypress", ...cypressArgs], {
    cwd: frontend,
    stdio: "inherit",
    shell: true,
    env: { ...process.env },
  });
  child.on("exit", (code, signal) => {
    if (signal) process.exit(1);
    process.exit(code ?? 0);
  });
}

function spawnWithServers(mode, forwarded) {
  const child = spawn(
    process.execPath,
    [withServersScript, mode, ...forwarded],
    {
      cwd: root,
      stdio: "inherit",
      shell: false,
    }
  );
  child.on("exit", (code, signal) => {
    if (signal) process.exit(1);
    process.exit(code ?? 0);
  });
}

if (first === "run" && baseIs4173) {
  spawnCypressDirect(["run", ...extra.slice(1)]);
} else if (!first || first === "open") {
  const forwarded = first === "open" ? extra.slice(1) : [];
  spawnWithServers("open", forwarded);
} else if (first === "run") {
  spawnWithServers("run", extra.slice(1));
} else {
  spawnCypressDirect(extra);
}

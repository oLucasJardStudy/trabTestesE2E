import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import initSqlJs from "sql.js";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");
const dbPath = path.join(dataDir, "app.db");

const SEED_EMAIL = "aluno@teste.com";
const SEED_PASSWORD = "Senha123!";

/** sql.js no monorepo (hoist na raiz) ou em backend/node_modules */
function wasmDir() {
  const candidates = [
    path.join(__dirname, "..", "node_modules", "sql.js", "dist"),
    path.join(__dirname, "node_modules", "sql.js", "dist"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "sql-wasm.wasm"))) return dir;
  }
  throw new Error(
    "Pasta dist do sql.js não encontrada. Execute npm install na raiz do projeto."
  );
}

function saveToDisk(db) {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

export function initSchema(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    );
  `);
}

/** @returns {boolean} true se inseriu seed */
export function seedIfEmpty(db) {
  const res = db.exec("SELECT COUNT(*) AS c FROM users");
  const count = Number(res[0]?.values?.[0]?.[0] ?? 0);
  if (count > 0) return false;
  const hash = bcrypt.hashSync(SEED_PASSWORD, 10);
  db.run("INSERT INTO users (email, password_hash) VALUES (?, ?)", [
    SEED_EMAIL,
    hash,
  ]);
  return true;
}

export function getUserByEmail(db, email) {
  const stmt = db.prepare(
    "SELECT id, email, password_hash FROM users WHERE email = ?"
  );
  stmt.bind([email]);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const row = stmt.getAsObject();
  stmt.free();
  return row;
}

/**
 * Abre (ou cria) o SQLite em arquivo usando sql.js — sem addon nativo,
 * compatível com qualquer versão suportada do Node.js.
 */
export async function openDatabase() {
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(wasmDir(), file),
  });

  let db;
  if (fs.existsSync(dbPath)) {
    const fileBuf = fs.readFileSync(dbPath);
    db = new SQL.Database(new Uint8Array(fileBuf));
  } else {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    db = new SQL.Database();
  }

  initSchema(db);
  const inserted = seedIfEmpty(db);
  if (inserted || !fs.existsSync(dbPath)) {
    saveToDisk(db);
  }

  return { db, close: () => db.close() };
}

export { SEED_EMAIL, SEED_PASSWORD };

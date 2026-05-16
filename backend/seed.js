import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { openDatabase, SEED_EMAIL } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");

if (fs.existsSync(dataDir)) {
  fs.rmSync(dataDir, { recursive: true, force: true });
}

const { db, close } = await openDatabase();
close();
console.log(`Banco recriado. Usuário de teste: ${SEED_EMAIL}`);

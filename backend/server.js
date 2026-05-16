import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { getUserByEmail, openDatabase } from "./db.js";

const PORT = Number(process.env.PORT) || 3000;
const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  })
);
app.use(express.json());

const { db } = await openDatabase();

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.post("/login", (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  const password =
    typeof req.body?.password === "string" ? req.body.password : "";

  if (!email || !password) {
    return res.status(400).json({ message: "Credenciais inválidas" });
  }

  const user = getUserByEmail(db, email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ message: "Credenciais inválidas" });
  }

  return res.status(200).json({ message: "Login efetuado com sucesso!" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API em http://127.0.0.1:${PORT}`);
});

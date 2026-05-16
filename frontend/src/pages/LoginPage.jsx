import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginRequest } from "../api.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = Boolean(email.trim() && password.trim());

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError("");
    setFieldErrors({});

    const next = {};
    if (!email.trim()) next.email = "E-mail é obrigatório";
    if (!password.trim()) next.password = "Senha é obrigatória";
    if (Object.keys(next).length) {
      setFieldErrors(next);
      return;
    }

    setLoading(true);
    try {
      const { ok, data } = await loginRequest(email.trim(), password);
      if (ok && data?.message) {
        navigate("/home", { state: { successMessage: data.message } });
        return;
      }
      setApiError("Credenciais inválidas");
    } catch {
      setApiError("Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 400,
        margin: "3rem auto",
        padding: "0 1rem",
      }}
    >
      <h1 style={{ fontSize: "1.5rem" }}>Entrar</h1>
      <form
        data-cy="login-form"
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <div>
          <label htmlFor="email" style={{ display: "block", marginBottom: 4 }}>
            E-mail
          </label>
          <input
            id="email"
            data-cy="email-input"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "0.5rem" }}
          />
          {fieldErrors.email && (
            <p data-cy="email-error" style={{ color: "#f85149", margin: "0.35rem 0 0" }}>
              {fieldErrors.email}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="password" style={{ display: "block", marginBottom: 4 }}>
            Senha
          </label>
          <input
            id="password"
            data-cy="password-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "0.5rem" }}
          />
          {fieldErrors.password && (
            <p data-cy="password-error" style={{ color: "#f85149", margin: "0.35rem 0 0" }}>
              {fieldErrors.password}
            </p>
          )}
        </div>
        {apiError && (
          <p data-cy="api-error" role="alert" style={{ color: "#f85149", margin: 0 }}>
            {apiError}
          </p>
        )}
        <button
          type="submit"
          data-cy="submit-btn"
          disabled={!canSubmit || loading}
        >
          Entrar
        </button>
      </form>
    </main>
  );
}

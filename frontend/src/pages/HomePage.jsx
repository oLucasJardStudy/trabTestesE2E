import { Link, useLocation } from "react-router-dom";

export default function HomePage() {
  const location = useLocation();
  const message =
    location.state?.successMessage || "Login efetuado com sucesso!";

  return (
    <main style={{ maxWidth: 560, margin: "3rem auto", padding: "0 1rem" }}>
      <h1 style={{ fontSize: "1.5rem" }}>Home</h1>
      <p data-cy="success-message">{message}</p>
      <p>
        <Link to="/login" data-cy="back-login">
          Voltar ao login
        </Link>
      </p>
    </main>
  );
}

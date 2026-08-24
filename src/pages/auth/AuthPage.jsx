import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Logo from "../../components/brand/Logo.jsx";
import { auth } from "../../services/admin-api.js";
import "./auth.css";

function AuthPage({ title, buttonLabel }) {
  const login = title === "Login";
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [session, setSession] = useState(null);

  const authenticatedDestination = (user) =>
    ["client", "business-authorized-user"].includes(user?.role_slug)
      ? "/client-portal/dashboard"
      : "/admin/dashboard";

  if (session?.authenticated) {
    return <Navigate to={authenticatedDestination(session.user)} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (login) {
        const sessionData = await auth.login({ email, password });
        setSession({ authenticated: true, user: sessionData?.user || null });
        navigate(authenticatedDestination(sessionData?.user), {
          replace: true,
        });
        return;
      }

      setError(
        "Account creation is not enabled in this phase. Please request access from the team.",
      );
    } catch (caughtError) {
      setError(caughtError.message || "The request could not be completed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <Link to="/">
          <Logo surface="dark" />
        </Link>
        <div>
          <span>Secure access</span>
          <h1>
            {login ? "Welcome back." : "Begin with a confirmed relationship."}
          </h1>
          <p>
            {login
              ? "Access the workspace connected to your Alchemize services."
              : "Portal access is provided after an established service relationship is confirmed."}
          </p>
        </div>
      </section>
      <section className="auth-form-panel">
        <div className="auth-card">
          <span className="eyebrow">Account access</span>
          <h2>{title}</h2>
          <p>
            {login
              ? "Enter your account details to continue."
              : "Submit basic access information. Account creation is not automatic."}
          </p>
          <form onSubmit={handleSubmit}>
            {!login && (
              <label>
                Full name
                <input
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </label>
            )}
            <label>
              Email address
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            {login && (
              <label>
                Password
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
            )}
            {error && <p role="alert">{error}</p>}
            <button
              className="button button-primary"
              type="submit"
              disabled={loading}
            >
              {loading ? "Please wait..." : buttonLabel}
            </button>
          </form>
          <footer>
            {login ? (
              <>
                <span>Need access?</span>
                <Link to="/register">Request account access</Link>
              </>
            ) : (
              <>
                <span>Already have access?</span>
                <Link to="/login">Return to login</Link>
              </>
            )}
          </footer>
          <Link className="auth-return" to="/">
            ← Return to Alchemize
          </Link>
        </div>
      </section>
    </main>
  );
}
export default AuthPage;

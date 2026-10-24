
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import "./AuthPage.css";

export default function AuthPage({ mode = "login" }) {
  const isRegister = mode === "register";
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "CUSTOMER",
    businessName: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (isRegister) {
        await register(form);
      } else {
        await login({
          email: form.email,
          password: form.password,
        });
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to connect. Check that the backend is running.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link className="auth-brand" to="/">
          SmartServe<span> AI</span>
        </Link>

        <p className="auth-eyebrow">
          {isRegister ? "GET STARTED" : "WELCOME BACK"}
        </p>

        <h1>{isRegister ? "Create your account" : "Sign in to SmartServe"}</h1>

        <p className="auth-subtitle">
          {isRegister
            ? "Book trusted home services or offer your expertise."
            : "Manage your home services in one place."}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
            <>
              <label>
                Full name
                <input
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  required
                />
              </label>

              <label>
                Account type
                <select
                  name="role"
                  value={form.role}
                  onChange={updateField}
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="PROVIDER">Service provider</option>
                </select>
              </label>

              {form.role === "PROVIDER" && (
                <label>
                  Business name
                  <input
                    name="businessName"
                    value={form.businessName}
                    onChange={updateField}
                    minLength={2}
                    maxLength={120}
                    required
                  />
                </label>
              )}
            </>
          )}

          <label>
            Email address
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={updateField}
              minLength={isRegister ? 8 : undefined}
              maxLength={72}
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
            />
          </label>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button
            className="auth-submit"
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? "Please wait..."
              : isRegister
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <p className="auth-switch">
          {isRegister ? "Already have an account?" : "New to SmartServe?"}{" "}
          <Link to={isRegister ? "/login" : "/register"}>
            {isRegister ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </section>
    </main>
  );
}
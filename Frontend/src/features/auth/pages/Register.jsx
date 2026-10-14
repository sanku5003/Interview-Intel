import React, { useState } from "react";
import "./auth.form.scss";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../Hooks/useAuth";
import Loading from "../components/Loading";

const Register = () => {
  const { loading, handleRegister } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const result = await handleRegister({
      email,
      username,
      contact,
      password,
    });

    if (result.success) {
      navigate("/");
      return;
    }

    setError(result.message || "Registration failed");
  };

  if (loading) {
    return <Loading />;
  }
  return (
    <main className="auth-page">
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-intro">
            <p className="eyebrow">AI Interview Coach</p>
            <h1>Create your account</h1>
            <p className="auth-subtitle">
              Join to generate interview prep insights and track your progress.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-tabs">
              <div className="input-group">
                <label htmlFor="username">Username</label>
                <input
                  className={error ? "field-error" : ""}
                  onChange={(e) => setUsername(e.target.value)}
                  type="text"
                  id="username"
                  placeholder="Enter your username"
                />
              </div>
              <div className="input-group">
                <label htmlFor="email">Email</label>
                <input
                  className={error ? "field-error" : ""}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  id="email"
                  placeholder="Enter your email"
                />
              </div>
              <div className="input-group">
                <label htmlFor="contact">Contact number</label>
                <input
                  className={error ? "field-error" : ""}
                  onChange={(e) => setContact(e.target.value)}
                  type="tel"
                  id="contact"
                  autoComplete="tel"
                  placeholder="Enter your contact number"
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="password">Password</label>
                <input
                  className={error ? "field-error" : ""}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  id="password"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {error && <div className="form-error">{error}</div>}

            <button className="btn auth-btn" type="submit">
              Register
            </button>

            <p className="auth-switch">
              Already have an account?{" "}
              <Link className="link auth-link" to="/login">
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
};

export default Register;

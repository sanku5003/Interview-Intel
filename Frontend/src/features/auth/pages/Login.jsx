import React, { useState } from "react";
import "./auth.form.scss";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../Hooks/useAuth";
import Loading from "../components/Loading";


const Login = () => {
  const { loading, handleLogin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const result = await handleLogin({ email, password });

    if (result.success) {
      navigate("/");
      return;
    }

    setError(result.message || "Invalid email or password");
  };

  if(loading){
    return <Loading />
  }

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-intro">
            <p className="eyebrow">AI Interview Coach</p>
            <h1>Welcome back</h1>
            <p className="auth-subtitle">
              Sign in to continue reviewing and improving your interview readiness.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-tabs">
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

            <p className="auth-forgot-link">
              <Link className="link auth-link" to="/forgot-password">
                Forgot password?
              </Link>
            </p>

            {error && <div className="form-error">{error}</div>}

            <button className="btn auth-btn" type="submit">
              Login
            </button>

            <p className="auth-switch">
              Don't have an account?{" "}
              <Link className="link auth-link" to="/register">
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
};

export default Login;

import { useState } from "react";
import { Link } from "react-router";
import {
  requestPasswordReset,
  resetPassword,
  verifyPasswordResetCode,
} from "../Services/Auth.api";
import "./auth.form.scss";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState("request");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);

    try {
      if (step === "request") {
        const result = await requestPasswordReset(email.trim());
        setNotice(result.message);
        setStep("verify");
        return;
      }

      if (step === "verify") {
        const result = await verifyPasswordResetCode({
          email: email.trim(),
          code: code.trim(),
        });
        setResetToken(result.resetToken);
        setNotice(result.message);
        setStep("reset");
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      const result = await resetPassword({ resetToken, newPassword });
      setNotice(result.message);
      setStep("complete");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Password recovery failed. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setNotice("");
    setBusy(true);

    try {
      const result = await requestPasswordReset(email.trim());
      setNotice(result.message);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to resend the code. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-intro">
            <p className="eyebrow">AI Interview Coach</p>
            <h1>{step === "complete" ? "Password updated" : "Reset your password"}</h1>
            <p className="auth-subtitle">
              {step === "request" && "Enter your account email to receive a verification code by SMS."}
              {step === "verify" && "Enter the SMS verification code sent to your registered number."}
              {step === "reset" && "Choose a new password for your account."}
              {step === "complete" && "Your password has been changed. You can now sign in."}
            </p>
          </div>

          {step === "complete" ? (
            <div className="auth-form">
              <div className="form-success" role="status">{notice}</div>
              <Link className="btn auth-btn auth-button-link" to="/login">
                Back to login
              </Link>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="input-tabs">
                <div className="input-group">
                  <label htmlFor="recovery-email">Email</label>
                  <input
                    id="recovery-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Enter your account email"
                    required
                    readOnly={step !== "request"}
                  />
                </div>

                {step === "verify" && (
                  <div className="input-group">
                    <label htmlFor="verification-code">SMS verification code</label>
                    <input
                      id="verification-code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      placeholder="Enter the code"
                      required
                    />
                  </div>
                )}

                {step === "reset" && (
                  <>
                    <div className="input-group">
                      <label htmlFor="new-password">New password</label>
                      <input
                        id="new-password"
                        type="password"
                        autoComplete="new-password"
                        minLength={6}
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        placeholder="At least 6 characters"
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label htmlFor="confirm-password">Confirm new password</label>
                      <input
                        id="confirm-password"
                        type="password"
                        autoComplete="new-password"
                        minLength={6}
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Re-enter your new password"
                        required
                      />
                    </div>
                  </>
                )}
              </div>

              {notice && <div className="form-success" role="status">{notice}</div>}
              {error && <div className="form-error" role="alert">{error}</div>}

              <button className="btn auth-btn" type="submit" disabled={busy}>
                {busy
                  ? "Please wait..."
                  : step === "request"
                    ? "Send verification code"
                    : step === "verify"
                      ? "Verify code"
                      : "Reset password"}
              </button>

              {step === "verify" && (
                <div className="auth-recovery-actions">
                  <button
                    className="auth-text-button"
                    type="button"
                    onClick={handleResend}
                    disabled={busy}
                  >
                    Resend code
                  </button>
                  <button
                    className="auth-text-button"
                    type="button"
                    onClick={() => {
                      setStep("request");
                      setCode("");
                      setResetToken("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setNotice("");
                      setError("");
                    }}
                    disabled={busy}
                  >
                    Change email
                  </button>
                </div>
              )}

              <p className="auth-switch">
                Remembered your password?{" "}
                <Link className="link auth-link" to="/login">Login</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
};

export default ForgotPassword;
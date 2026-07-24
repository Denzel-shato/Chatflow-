import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import Cookies from "universal-cookie";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../Firebase/firebase";
import ChatFlowLogo from "../components/ChatFlowLogo";

const cookies = new Cookies();

/* ─────────────────────────────────────────
   Design tokens — premium SaaS palette
───────────────────────────────────────── */
const T = {
  bg: "#09090b",
  surface: "#18181b",
  surfaceHover: "#27272a",
  border: "#27272a",
  borderHover: "#3f3f46",
  textPrimary: "#fafafa",
  textSecondary: "#a1a1aa",
  textTertiary: "#52525b",
  accent: "#5b57e0",
  accentHover: "#6c68ee",
  danger: "#ef4444",
};

/* ─────────────────────────────────────────
   Input field — flat, no glow
───────────────────────────────────────── */
function Field({
  id,
  type = "text",
  placeholder,
  icon,
  value,
  onChange,
  error,
}) {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === "password";

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: 48,
          padding: "0 14px",
          borderRadius: 12,
          border: `1px solid ${
            error ? T.danger : focused ? T.borderHover : T.border
          }`,
          transition: "border-color 0.15s ease",
        }}
        className="bg-[#16161a]"
      >
        <span
          style={{
            marginRight: 10,
            display: "flex",
            flexShrink: 0,
            color: error
              ? T.danger
              : focused
              ? T.textSecondary
              : T.textTertiary,
            transition: "color 0.15s ease",
          }}
        >
          {icon}
        </span>
        <input
          id={id}
          type={isPassword && showPw ? "text" : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            minWidth: 0,
            background: "transparent",
            border: "none",
            outline: "none",
            color: T.textPrimary,
            fontSize: 14,
            fontFamily: "inherit",
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            style={{
              display: "flex",
              flexShrink: 0,
              paddingLeft: 8,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: T.textTertiary,
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = T.textSecondary)
            }
            onMouseLeave={(e) => (e.currentTarget.style.color = T.textTertiary)}
          >
            {showPw ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && (
        <p
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            marginTop: 6,
            marginLeft: 2,
            color: T.danger,
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

/* ── Password strength meter — toned down ── */
function PasswordStrength({ password }) {
  if (!password) return null;

  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const trackColor = "#27272a";
  const fillColor = score === 4 ? T.accent : score >= 2 ? "#a1a1aa" : "#52525b";

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: i <= score ? fillColor : trackColor,
              transition: "background 0.2s ease",
            }}
          />
        ))}
      </div>
      {score > 0 && (
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: fillColor,
            transition: "color 0.2s ease",
          }}
        >
          {score === 1
            ? "Weak"
            : score === 2
            ? "Fair"
            : score === 3
            ? "Good"
            : "Strong"}{" "}
          password
        </p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
export default function SignUp() {
  const navigate = useNavigate();
  const [isAuth] = useState(cookies.get("auth-token"));

  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (isAuth) navigate("/messages");
  }, []);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: "" }));
    setGlobalError("");
  };

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = "Username is required";
    else if (form.username.length < 2) e.username = "Username too short";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "At least 6 characters";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setGlobalError("");
    try {
      const auth = getAuth();
      const credential = await createUserWithEmailAndPassword(
        auth,
        form.email.trim(),
        form.password.trim()
      );
      const user = credential.user;
      cookies.set("auth-token", user.refreshToken);
      cookies.set("name", user.email);
      await setDoc(
        doc(db, "Users", user.uid),
        {
          uid: user.uid,
          email: user.email,
          displayName: form.username.trim(),
          photoURL: user.photoURL || "",
          createdAt: new Date().toISOString(),
          searchName: form.username.toLowerCase().trim(),
          searchEmail: user.email.toLowerCase().trim(),
        },
        { merge: true }
      );
      navigate("/messages");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setErrors((e) => ({ ...e, email: "This email is already registered" }));
      } else if (err.code === "auth/network-request-failed") {
        setGlobalError("No internet connection. Please try again.");
      } else {
        setGlobalError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: T.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(16px)",
          transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 16,
            padding: "36px 32px",
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 28,
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <ChatFlowLogo size="lg" />
            </div>
            <h1
              style={{
                color: T.textPrimary,
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              Create your account
            </h1>
            <p
              style={{
                color: T.textTertiary,
                fontSize: 14,
                marginTop: 6,
                marginBottom: 0,
              }}
            >
              Join ChatFlow and start messaging today
            </p>
          </div>

          {/* Global error */}
          {globalError && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                borderLeft: `3px solid ${T.danger}`,
                background: "#0c0c0e",
                borderRadius: 10,
                padding: "12px 16px",
                marginBottom: 20,
                color: T.danger,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                style={{ flexShrink: 0 }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {globalError}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <Field
              id="username"
              placeholder="Username"
              value={form.username}
              onChange={set("username")}
              error={errors.username}
              icon={
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              }
            />

            <Field
              id="signUpEmail"
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={set("email")}
              error={errors.email}
              icon={
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              }
            />

            <div>
              <Field
                id="signUpPassword"
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={set("password")}
                error={errors.password}
                icon={
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                }
              />
              <PasswordStrength password={form.password} />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                height: 44,
                borderRadius: 12,
                border: "none",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 4,
                background: loading ? "#3f3f46" : T.accent,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = T.accentHover;
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = T.accent;
              }}
            >
              {loading ? (
                <>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      border: `2px solid ${T.borderHover}`,
                      borderTopColor: T.textSecondary,
                      animation: "spin 0.7s linear infinite",
                    }}
                  />
                  <span>Creating account…</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              margin: "20px 0",
            }}
          >
            <div style={{ flex: 1, height: 1, background: T.border }} />
            <span
              style={{
                color: T.textTertiary,
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.02em",
              }}
            >
              or
            </span>
            <div style={{ flex: 1, height: 1, background: T.border }} />
          </div>

          {/* Sign in link */}
          <Link
            to="/login"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              height: 44,
              borderRadius: 12,
              border: `1px solid ${T.border}`,
              background: "transparent",
              color: T.textPrimary,
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
              transition: "background 0.15s ease, border-color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = T.surfaceHover;
              e.currentTarget.style.borderColor = T.borderHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = T.border;
            }}
          >
            Sign in instead
          </Link>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              marginTop: 24,
              paddingTop: 20,
              borderTop: `1px solid ${T.border}`,
            }}
          >
            <span style={{ color: T.textTertiary, fontSize: 13 }}>
              Already have an account?
            </span>
            <Link
              to="/login"
              style={{
                color: T.textSecondary,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = T.textPrimary)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = T.textSecondary)
              }
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Back to home */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: T.textTertiary,
              fontSize: 13,
              textDecoration: "none",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = T.textSecondary)
            }
            onMouseLeave={(e) => (e.currentTarget.style.color = T.textTertiary)}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to home
          </Link>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

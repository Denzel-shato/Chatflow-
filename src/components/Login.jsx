import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Cookies from "universal-cookie";
import { db } from "../Firebase/firebase";
import ChatFlowLogo from "../components/ChatFlowLogo";

const cookies = new Cookies();

/* ─────────────────────────────────────────
   Design tokens — premium SaaS palette
   Single neutral scale + one purposeful
   accent. No glows, no soft tints, no
   vibe-coded translucency.
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
   Shared Firestore user upsert
───────────────────────────────────────── */
async function upsertUserDoc(user) {
  useEffect(async () => {
    const docRef = await getDoc(doc(db, "Users", user.uid));
    if (docRef.exists()) {
      return;
    }
    else {
    const displayName = user.displayName || "";
    const email = user.email || "";
    await setDoc(
      doc(db, "Users", user.uid),
      {
        uid: user.uid,
        email,
        displayName,
        photoURL: user.photoURL || "",
        createdAt: new Date().toISOString(),
        searchName: displayName.toLowerCase(),
        searchEmail: email.toLowerCase(),
      },
      { merge: true }
    );
    }
  }, [user.uid]);
}

/* ─────────────────────────────────────────
   Loading screen — minimal, no color
───────────────────────────────────────── */
function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: T.bg,
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        <ChatFlowLogo size="lg" />
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            border: `2px solid ${T.border}`,
            borderTopColor: T.textSecondary,
            animation: "spin 0.9s linear infinite",
          }}
        />
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

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

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [mounted, setMounted] = useState(false);

  /* Check if already logged in */
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/messages");
      } else {
        setChecking(false);
        setTimeout(() => setMounted(true), 50);
      }
    });
    return () => unsub();
  }, []);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: "" }));
    setGlobalError("");
  };

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "At least 6 characters";
    return e;
  };

  /* Email / password sign in */
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
      const credential = await signInWithEmailAndPassword(
        auth,
        form.email.trim(),
        form.password.trim()
      );
      const user = credential.user;

      const token = await user.getIdToken();
      cookies.set("auth-token", token);
      cookies.set("name", user.email);
      navigate("/messages");
    } catch (err) {
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setGlobalError("Invalid email or password.");
      } else if (err.code === "auth/network-request-failed") {
        setGlobalError("No internet connection. Please try again.");
      } else if (err.code === "auth/too-many-requests") {
        setGlobalError("Too many attempts. Please try again later.");
      } else {
        setGlobalError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* Google sign in */
  const handleGoogle = async () => {
    setGlobalError("");
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const token = await user.getIdToken();
      cookies.set("auth-token", token);
      cookies.set("name", user.email);

      await upsertUserDoc(user);

      navigate("/messages");
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        setGlobalError("Google sign-in failed. Please try again.");
      }
    }
  };

  if (checking) return <LoadingScreen />;

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
              Welcome back
            </h1>
            <p
              style={{
                color: T.textTertiary,
                fontSize: 14,
                marginTop: 6,
                marginBottom: 0,
              }}
            >
              Sign in to continue to ChatFlow
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
              id="loginEmail"
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

            <Field
              id="loginPassword"
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

            {/* Forgot password */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: -2,
              }}
            >
              <Link
                to="/forgot-password"
                style={{
                  color: T.textTertiary,
                  fontSize: 12,
                  textDecoration: "none",
                  transition: "color 0.15s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = T.textSecondary)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = T.textTertiary)
                }
              >
                Forgot password?
              </Link>
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
                  <span>Signing in…</span>
                </>
              ) : (
                <span>Sign In</span>
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

          {/* Google button */}
          <button
            onClick={handleGoogle}
            style={{
              width: "100%",
              height: 44,
              borderRadius: 12,
              border: `1px solid ${T.border}`,
              background: "transparent",
              color: T.textPrimary,
              fontSize: 14,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              cursor: "pointer",
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
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

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
              Don&apos;t have an account?
            </span>
            <Link
              to="/signup"
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
              Create an account
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

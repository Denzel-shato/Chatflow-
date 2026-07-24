import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { serverTimestamp, ref, set } from "firebase/database";
import { Link, useNavigate } from "react-router-dom";
import { getDatabase } from "firebase/database";
import { setAuthUser, setCachedUserData } from "./Messages";
import { removeNotificationToken } from "@components/fcm";

const db = getFirestore();

/* ── Design tokens ── */
const T = {
  bg: "#09090b",
  surface: "#18181b",
  surfaceHover: "#27272a",
  border: "#27272a",
  borderHover: "#3f3f46",
  divider: "#27272a",
  textPrimary: "#fafafa",
  textSecondary: "#a1a1aa",
  textMuted: "#52525b",
  icon: "#71717a",
  danger: "#ef4444",
};

export default function Settings() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
    });
    return () => unsub();
  }, []);

  const handleSignOut = async () => {
    const rtdb = getDatabase();
    const userRef = ref(rtdb, `status/${user.uid}`);
    setCachedUserData(null);
    setAuthUser(null);
    try {
      await set(userRef, { state: "offline", lastSeen: serverTimestamp() });
      setSigningOut(true);
      await removeNotificationToken(user, db);
      await signOut(getAuth());
      navigate("/");
    } catch (err) {
      console.error("Sign out failed:", err);
      setSigningOut(false);
    }
  };

  const avatarLetter = (user?.displayName || user?.email || "?")
    .charAt(0)
    .toUpperCase();

  return (
    <div
      style={{
        height: "100dvh",
        width: "100%",
        background: T.bg,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header — back arrow + title */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: `1px solid ${T.divider}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Link
          to="/messages"
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: T.icon,
            textDecoration: "none",
            flexShrink: 0,
            transition: "color 0.15s ease, background 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = T.textSecondary;
            e.currentTarget.style.background = T.surfaceHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = T.icon;
            e.currentTarget.style.background = "transparent";
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
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <p
          style={{
            color: T.textPrimary,
            fontSize: 16,
            fontWeight: 600,
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          Settings
        </p>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Profile card */}
        {user && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "16px",
              borderRadius: 12,
              background: T.surface,
              border: `1px solid ${T.border}`,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                flexShrink: 0,
                background: T.surfaceHover,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span
                  style={{
                    color: T.textSecondary,
                    fontWeight: 600,
                    fontSize: 18,
                  }}
                >
                  {avatarLetter}
                </span>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  color: T.textPrimary,
                  fontWeight: 600,
                  fontSize: 15,
                  margin: 0,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  letterSpacing: "-0.01em",
                }}
              >
                {user.displayName || "No name"}
              </p>
              <p
                style={{
                  color: T.textMuted,
                  fontSize: 13,
                  margin: "3px 0 0",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user.email}
              </p>
            </div>
          </div>
        )}

        {/* Sign out */}
        <div
          style={{
            borderRadius: 12,
            border: `1px solid ${T.border}`,
            overflow: "hidden",
          }}
        >
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 16px",
              background: "transparent",
              border: "none",
              cursor: signingOut ? "not-allowed" : "pointer",
              opacity: signingOut ? 0.5 : 1,
              transition: "background 0.15s ease, opacity 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!signingOut)
                e.currentTarget.style.background = T.surfaceHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                flexShrink: 0,
                background: T.surfaceHover,
                border: `1px solid ${T.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke={T.danger}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                width="16"
                height="16"
              >
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <span style={{ color: T.danger, fontWeight: 600, fontSize: 14 }}>
              {signingOut ? "Signing out…" : "Sign Out"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

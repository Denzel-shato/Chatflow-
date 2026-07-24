import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { Link } from "react-router-dom";

const db = getFirestore();

/* ── Design tokens — premium neutral palette ── */
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
  success: "#22c55e",
};

const formatDuration = (s) => {
  if (!s) return "0:00";
  const m = Math.floor(s / 60);
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

const formatTime = (ts) => {
  if (!ts) return "";
  const date = ts.toDate?.() || new Date(ts);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString([], { day: "numeric", month: "short" });
};

const PhoneIcon = ({ callType, status }) => {
  const color = status === "missed" ? T.danger : T.success;
  if (callType === "video")
    return (
      <svg viewBox="0 0 24 24" fill={color} width="14" height="14">
        <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" fill={color} width="14" height="14">
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
    </svg>
  );
};

export default function Calls() {
  const [user, setUser] = useState(null);
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "CallHistory"),
      where("participants", "array-contains", user.uid),
      orderBy("timestamp", "desc")
    );

    const unsub = onSnapshot(q, async (snap) => {
      const results = await Promise.all(
        snap.docs.map(async (d) => {
          const data = { id: d.id, ...d.data() };
          const otherUID =
            data.participants?.find((id) => id !== user.uid) ?? data.callerID;

          if (otherUID) {
            try {
              const otherSnap = await getDoc(doc(db, "Users", otherUID));
              if (otherSnap.exists()) {
                data.otherUser = otherSnap.data();
              }
            } catch (_) {}
          }
          return data;
        })
      );

      setCalls(results);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

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
          Call History
        </p>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {loading && (
          <div
            style={{ display: "flex", justifyContent: "center", marginTop: 60 }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                border: `2px solid ${T.border}`,
                borderTopColor: T.textSecondary,
                animation: "spin 0.8s linear infinite",
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {!loading && calls.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "60%",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: T.surface,
                border: `1px solid ${T.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg viewBox="0 0 24 24" fill={T.icon} width="20" height="20">
                <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
              </svg>
            </div>
            <p style={{ color: T.textMuted, fontSize: 14, margin: 0 }}>
              No call history yet
            </p>
          </div>
        )}

        {calls.map((call) => {
          const name =
            call.otherUser?.displayName ||
            call.otherUser?.name ||
            call.callerName ||
            "Unknown";
          const photo = call.otherUser?.photoURL;
          const missed = call.status === "Missed Call";
          const noAnswer = call.status === "No Answer";

          return (
            <div
              key={call.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 16px",
                cursor: "default",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = T.surfaceHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {/* Avatar */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: T.surfaceHover,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {photo ? (
                  <img
                    src={photo}
                    alt={name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span
                    style={{
                      color: T.textSecondary,
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {name[0]?.toUpperCase()}
                  </span>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    color: T.textPrimary,
                    fontWeight: 500,
                    fontSize: 14,
                    margin: 0,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {name}
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 2,
                  }}
                >
                  <PhoneIcon callType={call.callType} status={call.status} />
                  <span
                    style={{
                      color: missed ? T.danger : T.textMuted,
                      fontSize: 12,
                      fontWeight: missed ? 500 : 400,
                    }}
                  >
                    {noAnswer && "No Answer"}
                    {missed && "Missed Call"}
                    {!noAnswer &&
                      !missed &&
                      `${
                        call.callType === "video" ? "Video" : "Voice"
                      } · ${formatDuration(call.duration)}`}
                  </span>
                </div>
              </div>

              {/* Time */}
              <span style={{ color: T.textMuted, fontSize: 12, flexShrink: 0 }}>
                {formatTime(call.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

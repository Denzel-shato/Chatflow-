import { isToday, isYesterday, format } from "date-fns";

/* ── Local neutral tokens ── */
const N = {
  header: "#09090b",
  surface: "#18181b",
  surfaceHover: "#27272a",
  border: "#27272a",
  borderHover: "#3f3f46",
  divider: "#27272a",
  textPrimary: "#fafafa",
  textSecondary: "#a1a1aa",
  textMuted: "#52525b",
  icon: "#71717a",
  online: "#22c55e",
  onlineText: "#22c55e",
  accent: "#5b57e0",
};

export default function ChatHeader({
  otherUser,
  status,
  callsDropdown,
  setCallsDropdown,
  onBack,
  onStartCall,
}) {
  const getLastSeen = () => {
    if (!status?.lastSeen) return "";
    if (isToday(status.lastSeen))
      return "last seen today at " + format(status.lastSeen, "h:mm a");
    if (isYesterday(status.lastSeen))
      return "last seen yesterday at " + format(status.lastSeen, "h:mm a");
    return "last seen " + format(status.lastSeen, "h:mm a d MMM y");
  };

  const isOnline = status?.state === "online";

  const btnStyle = {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "transparent",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    color: N.icon,
    transition: "color 0.15s ease, background 0.15s ease",
  };

  return (
    <div
      style={{
        position: "relative",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        height: 60,
        padding: "0 16px",
        flexShrink: 0,
        background: N.header,
        borderBottom: `1px solid ${N.divider}`,
      }}
    >
      {/* Back */}
      <button
        onClick={onBack}
        style={btnStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = N.textSecondary;
          e.currentTarget.style.background = N.surfaceHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = N.icon;
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
          <path d ="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Avatar */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <img
          src={otherUser?.photoURL || "/profile.png"}
          alt={otherUser?.displayName}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            objectFit: "cover",
            display: "block",
          }}
        />
        {isOnline && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: N.online,
              border: `2px solid ${N.header}`,
            }}
          />
        )}
      </div>

      {/* Name + status */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <span
          style={{
            color: N.textPrimary,
            fontWeight: 600,
            fontSize: 15,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            letterSpacing: "-0.01em",
          }}
        >
          {otherUser?.displayName || otherUser?.name}
        </span>
        {isOnline ? (
          <span style={{ fontSize: 12, fontWeight: 500, color: N.onlineText }}>
            Online
          </span>
        ) : (
          <span
            style={{
              color: N.textMuted,
              fontSize: 12,
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {getLastSeen()}
          </span>
        )}
      </div>

      {/* Call menu */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <button
          onClick={() => setCallsDropdown((v) => !v)}
          style={btnStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = N.textSecondary;
            e.currentTarget.style.background = N.surfaceHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = N.icon;
            e.currentTarget.style.background = "transparent";
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>

        {callsDropdown && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 40,
              zIndex: 50,
              background: N.surface,
              border: `1px solid ${N.border}`,
              borderRadius: 12,
              padding: 4,
              minWidth: 160,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {[
              {
                type: "voice",
                label: "Voice call",
                path: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.02 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z",
              },
              { type: "video", label: "Video call", path: null },
            ].map(({ type, label, path }) => (
              <button
                key={type}
                onClick={() => {
                  onStartCall(type);
                  setCallsDropdown(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: N.textPrimary,
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: "inherit",
                  width: "100%",
                  textAlign: "left",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = N.surfaceHover)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "none")
                }
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: N.surfaceHover,
                    border: `1px solid ${N.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {type === "voice" ? (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={N.icon}
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d={path ?? ""} />
                    </svg>
                  ) : (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={N.icon}
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" />
                    </svg>
                  )}
                </div>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

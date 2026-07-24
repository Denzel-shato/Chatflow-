import { useEffect, useRef } from "react";
import { isToday, isYesterday, format, isSameMinute } from "date-fns";

/* ── Local neutral tokens (override any theme glow) ── */
const N = {
  page: "#09090b",
  surface: "#18181b",
  border: "#27272a",
  textPrimary: "#fafafa",
  textSecondary: "#a1a1aa",
  textMuted: "#52525b",
  myBubble: "#27272a",
  myText: "#fafafa",
  theirBubble: "#18181b",
  theirBorder: "#27272a",
  theirText: "#e4e4e7",
  timeOnMine: "#71717a",
  timeOnTheirs: "#71717a",
  tickRead: "#a1a1aa",
  tickSent: "#52525b",
  accent: "#5b57e0",
};

const getTime = (item) => {
  const ts = item?.timestamp;
  if (!ts?.toDate) return "";
  const t = ts.toDate();
  if (isSameMinute(t, Date.now())) return "now";
  return format(t, "h:mm a").toLowerCase();
};

const getDate = (item) => {
  const ts = item?.timestamp;
  if (!ts?.toDate) return null;
  const d = ts.toDate();
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "d MMM y");
};

/* ── Read receipt ticks ── */
function Ticks({ isRead }) {
  const color = isRead ? N.tickRead : N.tickSent;
  return (
    <svg
      width="16"
      height="10"
      viewBox="0 0 16 10"
      fill="none"
      style={{
        flexShrink: 0,
        display: "inline-block",
        verticalAlign: "middle",
      }}
    >
      <path
        d="M1 5l2.5 2.5L7 2"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 5l2.5 2.5L15 2"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Typing indicator ── */
function TypingIndicator() {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: N.theirBubble,
        border: `1px solid ${N.theirBorder}`,
        padding: "10px 14px",
        borderRadius: "14px 14px 14px 4px",
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: N.textMuted,
            animation: "typingBounce 1.4s ease-in-out infinite",
            animationDelay: `${i * 0.16}s`,
            display: "block",
          }}
        />
      ))}
    </div>
  );
}

/* ── Message bubble ── */
function MessageBubble({ item, isMine, showDate, dateLabel }) {
  const isRead = item.readBy?.length > 1;
  const time = getTime(item);

  const renderContent = () => {
    if (item.type === "image") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <img
            src={item.mediaUrl || "/logo.svg"}
            alt={item.mediaMetadata?.name || "Image"}
            style={{
              maxWidth: "260px",
              maxHeight: "260px",
              borderRadius: 10,
              cursor: "pointer",
              objectFit: "cover",
              display: "block",
            }}
            onClick={() => window.open(item.mediaUrl, "_blank")}
          />
          {item.text && (
            <span
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                lineHeight: 1.5,
              }}
            >
              {item.text}
            </span>
          )}
        </div>
      );
    }

    return (
      <span
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          minWidth: 0,
          lineHeight: 1.5,
        }}
      >
        {item.text}
      </span>
    );
  };

  return (
    <div style={{ width: "100%" }}>
      {/* Date divider */}
      {showDate && dateLabel && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            margin: "16px 0 12px",
          }}
        >
          <span
            style={{
              color: N.textMuted,
              fontSize: 11,
              fontWeight: 500,
              background: N.surface,
              padding: "3px 10px",
              borderRadius: 6,
            }}
          >
            {dateLabel}
          </span>
        </div>
      )}

      {/* Bubble row */}
      <div
        style={{
          display: "flex",
          justifyContent: isMine ? "flex-end" : "flex-start",
          paddingLeft: isMine ? 48 : 16,
          paddingRight: isMine ? 16 : 48,
          marginBottom: 4,
        }}
      >
        <div
          style={{
            display: "inline-block",
            maxWidth: "100%",
            padding: item.type === "image" ? "4px" : "8px 12px",
            borderRadius: isMine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
            background: isMine ? N.myBubble : N.theirBubble,
            border: isMine ? "none" : `1px solid ${N.theirBorder}`,
            color: isMine ? N.myText : N.theirText,
            fontSize: 14,
            lineHeight: 1.45,
            wordBreak: "break-word",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            {renderContent()}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                whiteSpace: "nowrap",
                flexShrink: 0,
                marginLeft: "auto",
                alignSelf: "flex-end",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  lineHeight: 1,
                  color: isMine ? N.timeOnMine : N.timeOnTheirs,
                }}
              >
                {time}
              </span>
              {isMine && <Ticks isRead={isRead} />}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════ */
export default function MessageList({
  messages,
  userData,
  userChat,
  contactsUid,
  isTyping,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isTyping]);

  let lastDate = null;

  return (
    <>
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: .5; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>

      <div
        ref={containerRef}
        id="chatContainer"
        className="scrollbar-none"
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "12px 0",
          background: N.page,
          willChange: "scroll-position",
        }}
      >
        {messages.map((item, index) => {
          const isMine = item.senderId === userData[0].uid;
          const dateLabel = getDate(item);
          const showDate = dateLabel !== lastDate;
          lastDate = dateLabel;
          return (
            <MessageBubble
              key={item.messageId || index}
              item={item}
              isMine={isMine}
              showDate={showDate}
              dateLabel={dateLabel}
            />
          );
        })}

        {isTyping && (
          <div style={{ paddingLeft: 16, marginBottom: 12, marginTop: 4 }}>
            <TypingIndicator />
          </div>
        )}
      </div>
    </>
  );
}

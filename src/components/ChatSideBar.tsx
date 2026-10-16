/**
 * ChatSidebar.jsx
 */

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  writeBatch,
  doc,
  arrayUnion,
} from "firebase/firestore";
import { isToday, isYesterday, format } from "date-fns";

// ─────────────────────────────────────────────────────────────────────────────
// Theme — premium neutral palette (no purple, no glow, no gradients)
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  sidebar: "#09090b",
  surface: "#18181b",
  surfaceHover: "#27272a",
  input: "#18181b",
  inputFocus: "#27272a",
  navBg: "#18181b",
  menuBg: "#18181b",
  pill: "#18181b",
  border: "#27272a",
  borderHover: "#3f3f46",
  borderFocus: "#3f3f46",
  divider: "#27272a",
  textPrimary: "#fafafa",
  textSecondary: "#a1a1aa",
  textMuted: "#52525b",
  textAccent: "#a1a1aa",
  textUnread: "#fafafa",
  labelUnread: "#fafafa",
  badgeBg: "#fafafa",
  badgeText: "#09090b",
  icon: "#71717a",
  iconMuted: "#52525b",
  accent: "#5b57e0",
  accentHover: "#6c68ee",
  danger: "#ef4444",
  shadow: "none",
  shadowHover: "none",
  menuShadow: "0 8px 32px rgba(0,0,0,0.5)",
};

// ─────────────────────────────────────────────────────────────────────────────
// useUnreadCount — unread messages in a single chatroom
// ─────────────────────────────────────────────────────────────────────────────

function useUnreadCount(db, chatId, currentUid) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!chatId || !currentUid || !db) return;
    const unsub = onSnapshot(
      query(collection(db, "Chatrooms", chatId, "messages")),
      (snap) => {
        setCount(
          snap.docs.filter((d) => {
            const m = d.data();
            return m.senderId !== currentUid && !m.readBy?.includes(currentUid);
          }).length
        );
      },
      (err) =>
        console.error( err.code)
    );
    return () => unsub();
  }, [chatId, currentUid]);
  return count;
}

// ─────────────────────────────────────────────────────────────────────────────
// useTotalUnread — sum of unread messages across all chatrooms
// ─────────────────────────────────────────────────────────────────────────────

function useTotalUnread(db, chats, currentUid) {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!db || !currentUid || !chats?.length) {
      setTotal(0);
      return;
    }

    const counts = {};
    const unsubs = chats.map((chat) => {
      counts[chat.chatId] = 0;
      return onSnapshot(
        query(collection(db, "Chatrooms", chat.chatId, "messages")),
        (snap) => {
          counts[chat.chatId] = snap.docs.filter((d) => {
            const m = d.data();
            return m.senderId !== currentUid && !m.readBy?.includes(currentUid);
          }).length;
          setTotal(Object.values(counts).reduce((a, b) => a + b, 0));
        },
        (err) => console.error( err.code)
      );
    });

    return () => unsubs.forEach((u) => u());
  }, [db, chats, currentUid]);

  return total;
}

// ─────────────────────────────────────────────────────────────────────────────
// useUnreadMissedCalls
// ─────────────────────────────────────────────────────────────────────────────

function useUnreadMissedCalls(db, currentUid) {
  const [count, setCount] = useState(0);
  const [unreadIds, setUnreadIds] = useState([]);

  useEffect(() => {
    if (!db || !currentUid) return;

    const q = query(
      collection(db, "CallHistory"),
      where("participants", "array-contains", currentUid),where("forUserId", "==", currentUid),
      where("status", "==", "Missed Call")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const unread = snap.docs.filter((d) => {
          const readBy = d.data().readBy ?? [];
          return !readBy.includes(currentUid);
        });
        setCount(unread.length);
        setUnreadIds(unread.map((d) => d.id));
      },
      (err) => console.error( err.code)
    );

    return () => unsub();
  }, [db, currentUid]);

  return { count, unreadIds };
}

// ─────────────────────────────────────────────────────────────────────────────
// ChatItem — flat list row, no card borders
// ─────────────────────────────────────────────────────────────────────────────

function ChatItem({ chat, currentUid, db, onSelect }) {
  const other = chat.participantsInfo?.find((p) => p.uid !== currentUid);
  const unread = useUnreadCount(db, chat.chatId, currentUid);

  const getTime = () => {
    const ts = chat?.lastMessageAt;
    if (!ts?.toDate) return "";
    const d = ts.toDate();
    if (isToday(d)) return format(d, "h:mm a");
    if (isYesterday(d)) return "Yesterday";
    return format(d, "d MMM");
  };

  if (!other) return null;

  return (
    <div
      onClick={() => onSelect(chat.chatId)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "8px 12px",
        borderRadius: 10,
        cursor: "pointer",
        transition: "background 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = T.surfaceHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <div style={{ position: "relative", flexShrink: 0 }}>
        <img
          src={other.photoURL || "/profile.png"}
          alt={other.name}
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            objectFit: "cover",
            display: "block",
          }}
        />
        {unread > 0 && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: T.accent,
              border: `2px solid ${T.sidebar}`,
            }}
          />
        )}
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              color: T.textPrimary,
              fontWeight: unread > 0 ? 600 : 500,
              fontSize: 14,
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              letterSpacing: "-0.01em",
            }}
          >
            {other.name}
          </span>
          <span
            style={{
              color: unread > 0 ? T.textSecondary : T.textMuted,
              fontSize: 11,
              fontWeight: 400,
              flexShrink: 0,
              marginLeft: 8,
            }}
          >
            {getTime()}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <span
            style={{
              color: unread > 0 ? T.textSecondary : T.textMuted,
              fontWeight: unread > 0 ? 500 : 400,
              fontSize: 13,
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {chat.lastMessage || "No messages yet"}
          </span>
          {unread > 0 && (
            <div
              style={{
                minWidth: 18,
                height: 18,
                borderRadius: 99,
                background: T.badgeBg,
                color: T.badgeText,
                fontSize: 10,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 5px",
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              {unread > 99 ? "99+" : unread}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UserItem — search result row
// ─────────────────────────────────────────────────────────────────────────────

function UserItem({ user, onSelect }) {
  return (
    <div
      onClick={() => onSelect(user)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 12px",
        borderRadius: 10,
        cursor: "pointer",
        transition: "background 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = T.surfaceHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <img
        src={user.photoURL || "/profile.png"}
        alt={user.displayName}
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: T.textPrimary,
            fontWeight: 500,
            fontSize: 14,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            letterSpacing: "-0.01em",
          }}
        >
          {user.displayName}
        </div>
        <div
          style={{
            color: T.textMuted,
            fontSize: 13,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {user.email}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ChatSidebar
// ─────────────────────────────────────────────────────────────────────────────

export default function ChatSidebar({
  userData,
  chats,
  noChats,
  isLoading,
  db,
  onChatSelect,
  onSearchedChatSelect,
}) {
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [isSearchingContact, setIsSearchingContact] = useState(false);
  const [contactQuery, setContactQuery] = useState("");
  const [searchedContacts, setSearchedContacts] = useState([]);
  const [userQuery, setUserQuery] = useState("");
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [userExists, setUserExists] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const currentUid = userData[0]?.uid;

  const totalUnread = useTotalUnread(db, chats, currentUid);
  const { count: missedCallCount, unreadIds: unreadCallIds } =
    useUnreadMissedCalls(db, currentUid);

  const markCallsAsRead = useCallback(async () => {
    if (!unreadCallIds.length) return;
    const batch = writeBatch(db);
    unreadCallIds.forEach((id) => {
      batch.update(doc(db, "CallHistory", id), {
        readBy: arrayUnion(currentUid),
      });
    });
    await batch.commit();
  }, [db, currentUid, unreadCallIds]);

  const handleSearchContact = (value) => {
    setContactQuery(value);
    if (!value) {
      setIsSearchingContact(false);
      return;
    }
    setIsSearchingContact(true);
    const participants = chats.flatMap((chat) =>
      chat.participantsInfo.map((p) => ({
        ...p,
        chatId: chat.chatId,
        lastMessage: chat.lastMessage,
        lastMessageAt: chat.lastMessageAt,
      }))
    );
    const unique = participants.filter(
      (p, i, arr) =>
        p.uid !== currentUid && i === arr.findIndex((x) => x.uid === p.uid)
    );
    setSearchedContacts(
      unique.filter((p) => p.name.toLowerCase().includes(value.toLowerCase()))
    );
  };

  const handleSearchUser = async (e) => {
    e.preventDefault();
    if (!userQuery.trim()) return;
    const term = userQuery.toLowerCase().trim();
    const ref = collection(db, "Users");
    const [nameSnap, emailSnap] = await Promise.all([
      getDocs(query(ref, where("searchName", "==", term))),
      getDocs(query(ref, where("searchEmail", "==", term))),
    ]);
    const merged = [...nameSnap.docs, ...emailSnap.docs]
      .map((d) => ({ ...d.data(), id: d.id }))
      .filter(
        (u, i, arr) =>
          u.uid !== currentUid && arr.findIndex((x) => x.uid === u.uid) === i
      );
    setSearchedUsers(merged);
    setUserExists(merged.length > 0);
  };

  const NAV = [
    {
      to: "/Calls",
      label: "Calls",
      badge: missedCallCount,
      onNavClick: markCallsAsRead,
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.02 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
        </svg>
      ),
    },
    {
      to: "/Messages",
      label: "Chats",
      badge: totalUnread,
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      ),
    },
    {
      to: "/Settings",
      label: "Settings",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      ),
    },
  ];

  const inputStyle = {
    width: "100%",
    background: T.input,
    border: `1px solid ${T.border}`,
    borderRadius: 10,
    padding: "8px 14px",
    color: T.textPrimary,
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.15s ease, background 0.15s ease",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: T.sidebar,
        borderRight: `1px solid ${T.divider}`,
      }}
    >
      {/* ── Top bar: profile + menu ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px 10px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <img
            src={userData[0]?.photoURL || "/profile.png"}
            alt="me"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              color: T.textPrimary,
              fontWeight: 500,
              fontSize: 14,
              maxWidth: 140,
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              letterSpacing: "-0.01em",
            }}
          >
            {userData[0]?.displayName}
          </span>
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
          }}
        >
          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "transparent",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: T.iconMuted,
              transition: "color 0.15s ease, background 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = T.textSecondary;
              e.currentTarget.style.background = T.surfaceHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = T.iconMuted;
              e.currentTarget.style.background = "transparent";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>

          {menuOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 40,
                zIndex: 50,
                background: T.menuBg,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                boxShadow: T.menuShadow,
                padding: 4,
                minWidth: 160,
              }}
            >
              <button
                onClick={() => {
                  setIsSearchingUser(true);
                  setMenuOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: T.textPrimary,
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: "inherit",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = T.surfaceHover)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "none")
                }
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={T.icon}
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                Search user
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Search bar ── */}
      {!isSearchingUser && (
        <div style={{ padding: "0 16px 12px" }}>
          <div style={{ position: "relative" }}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke={T.iconMuted}
              strokeWidth="2"
              strokeLinecap="round"
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={contactQuery}
              onChange={(e) => handleSearchContact(e.target.value)}
              placeholder="Search contacts"
              style={{
                ...inputStyle,
                paddingLeft: 32,
                paddingRight: isSearchingContact ? 32 : 14,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = T.borderFocus;
                e.target.style.background = T.inputFocus;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = T.border;
                e.target.style.background = T.input;
              }}
            />
            {isSearchingContact && (
              <button
                onClick={() => {
                  setIsSearchingContact(false);
                  setContactQuery("");
                }}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: T.textMuted,
                  display: "flex",
                  padding: 2,
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Section label ── */}
      {!isSearchingUser &&
        !isSearchingContact &&
        !isLoading &&
        chats.length > 0 && (
          <div style={{ padding: "0 16px 6px" }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: T.textMuted }}>
              Messages
            </span>
          </div>
        )}

      {/* ── Scrollable content ── */}
      <div
        style={{ flex: 1, overflowY: "auto", padding: "0 8px 8px" }}
        className="scrollbar-none"
      >
        {isLoading && chats.length === 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "32px 0",
            }}
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
          </div>
        )}

        {isSearchingUser && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              paddingTop: 4,
            }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={() => {
                  setIsSearchingUser(false);
                  setSearchedUsers([]);
                  setUserQuery("");
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  flexShrink: 0,
                  background: "transparent",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: T.iconMuted,
                  transition: "color 0.15s ease, background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = T.textSecondary;
                  e.currentTarget.style.background = T.surfaceHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = T.iconMuted;
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <form
                onSubmit={handleSearchUser}
                style={{ display: "flex", gap: 8, flex: 1 }}
              >
                <input
                  type="text"
                  value={userQuery}
                  autoComplete="off"
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="Username or email"
                  style={{ ...inputStyle, flex: 1, minWidth: 0 }}
                  onFocus={(e) => {
                    e.target.style.borderColor = T.borderFocus;
                    e.target.style.background = T.inputFocus;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = T.border;
                    e.target.style.background = T.input;
                  }}
                />
                <button
                  type="submit"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    flexShrink: 0,
                    background: T.accent,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = T.accentHover)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = T.accent)
                  }
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                </button>
              </form>
            </div>
            {!userExists && (
              <p
                style={{
                  color: T.danger,
                  fontSize: 13,
                  textAlign: "center",
                  padding: "12px 0",
                }}
              >
                User does not exist
              </p>
            )}
            {searchedUsers.map((u, i) => (
              <UserItem
                key={i}
                user={u}
                onSelect={(u) => {
                  onSearchedChatSelect(u);
                  setIsSearchingUser(false);
                }}
              />
            ))}
          </div>
        )}

        {isSearchingContact && !isSearchingUser && (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {searchedContacts.length === 0 && (
              <p
                style={{
                  color: T.textMuted,
                  fontSize: 13,
                  textAlign: "center",
                  padding: "20px 0",
                }}
              >
                No contacts found
              </p>
            )}
            {searchedContacts.map((c, i) => (
              <div
                key={i}
                onClick={() => onChatSelect(c.chatId)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 12px",
                  borderRadius: 10,
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = T.surfaceHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <img
                  src={c?.photoURL || "/profile.png"}
                  alt={c.name}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: T.textPrimary,
                      fontWeight: 500,
                      fontSize: 14,
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {c.name}
                  </div>
                  <div
                    style={{
                      color: T.textMuted,
                      fontSize: 13,
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {c.lastMessage}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !isSearchingUser && !isSearchingContact && noChats && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 0",
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
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke={T.icon}
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  color: T.textSecondary,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                {noChats}
              </p>
              <p style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }}>
                Start by finding someone to chat with
              </p>
            </div>
            <button
              onClick={() => setIsSearchingUser(true)}
              style={{
                padding: "8px 18px",
                borderRadius: 10,
                border: "none",
                background: T.accent,
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = T.accentHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = T.accent)
              }
            >
              Find someone
            </button>
          </div>
        )}

        {!isSearchingUser &&
          !isSearchingContact &&
          !isLoading &&
          chats.map((chat, i) => (
            <ChatItem
              key={i}
              chat={chat}
              currentUid={currentUid}
              db={db}
              onSelect={onChatSelect}
            />
          ))}
      </div>

      {/* ── Bottom nav ── */}
      <div
        style={{
          padding: "8px 12px 12px",
          borderTop: `1px solid ${T.divider}`,
        }}
      >
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            background: T.navBg,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: "4px",
          }}
        >
          {NAV.map(({ to, label, icon, badge, onNavClick }) => (
            <Link
              key={to}
              to={to}
              onClick={onNavClick}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                padding: "8px 4px",
                borderRadius: 8,
                color: T.textMuted,
                textDecoration: "none",
                position: "relative",
                transition: "all 0.15s ease",
                fontSize: 10,
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = T.textSecondary;
                e.currentTarget.style.background = T.surfaceHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = T.textMuted;
                e.currentTarget.style.background = "none";
              }}
            >
              <div style={{ position: "relative", display: "inline-flex" }}>
                {icon}
                {badge && badge > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: -5,
                      right: -7,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 99,
                      background: T.badgeBg,
                      color: T.badgeText,
                      fontSize: 9,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 4px",
                      lineHeight: 1,
                      outline: `2px solid ${T.navBg}`,
                    }}
                  >
                    {badge > 99 ? "99+" : badge}
                  </div>
                )}
              </div>
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

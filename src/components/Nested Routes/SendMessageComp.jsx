import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import fileValidation from "../FileValidation";
import useMediaUpload from "../MediaUpload";
import useSendMessages from "../../Messages customHooks/Sending-Messages";

/* ── Local neutral tokens ── */
const N = {
  header: "#09090b",
  surface: "#18181b",
  surfaceHover: "#27272a",
  border: "#27272a",
  borderFocus: "#3f3f46",
  divider: "#27272a",
  textPrimary: "#fafafa",
  textSecondary: "#a1a1aa",
  textMuted: "#52525b",
  icon: "#71717a",
  accent: "#5b57e0",
  accentHover: "#6c68ee",
};

const MAX_HEIGHT = 200;

export default function GrowingTextarea({
  userData,
  chatId,
  db,
  otherUserdata,
}) {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const frontRef = useRef(null);
  const rearRef = useRef(null);
  const galleryRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const {
    uploadFile,
    uploading: isUploading,
    uploadProgress,
    error,
    clearError,
  } = useMediaUpload();
  const { mutateAsync: sendMessage } = useSendMessages({ chatId, userData });

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const h = Math.min(el.scrollHeight, MAX_HEIGHT);
    el.style.height = `${h}px`;
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? "auto" : "hidden";
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false); // tracks current state locally to avoid redundant writes

  // Single source of truth for turning typing off — used by the debounce
  // timeout, handleSend, handleFileCapture, and unmount cleanup.
  const clearTypingStatus = useCallback(() => {
    clearTimeout(typingTimeoutRef.current);
    if (!isTypingRef.current) return;
    isTypingRef.current = false;
    const uid = userData?.[0]?.uid;
    if (chatId && uid) {
      updateDoc(doc(db, "Chatrooms", chatId), {
        [`typing.${uid}`]: false,
      }).catch(() => {});
    }
  }, [chatId, userData]);

  const setTyping = useCallback(async () => {
    const uid = userData?.[0]?.uid;
    if (!chatId || !uid) return;

    clearTimeout(typingTimeoutRef.current);

    // Only write "true" if we weren't already marked as typing —
    // avoids a Firestore write on every single keystroke.
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      try {
        await updateDoc(doc(db, "Chatrooms", chatId), {
          [`typing.${uid}`]: true,
        });
      } catch (e) {
        console.error("setTyping: failed to set typing true:", e);
      }
    }

    typingTimeoutRef.current = setTimeout(() => {
      clearTypingStatus();
    }, 2000);
  }, [chatId, userData, clearTypingStatus]);

  // Clear typing status if the user switches chats or leaves the screen
  // mid-timeout, so it never gets stuck "on" for the other person.
  useEffect(() => {
    return () => {
      clearTypingStatus();
    };
  }, [chatId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async () => {
    if (!value.trim()) return;
    const text = value;
    setValue("");

    // Clear typing immediately so the recipient doesn't see
    // "typing…" linger after the message has already arrived.
    clearTypingStatus();

    sendMessage({ text: text, type: "text", mediaUrl: null });
  };

  const handleFileCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = fileValidation(file);
    if (!validation.ok) {
      alert(validation.error);
      return;
    }

    clearTypingStatus();

    const localPreview = URL.createObjectURL(file);
    setUploading(true);

    const response = await sendMessage({
      text: null,
      type: "image",
      mediaUrl: localPreview,
    });
    const messageId = response.messageRef.id;
    const result = await uploadFile(file);
    URL.revokeObjectURL(localPreview);

    if (result.success) {
      await updateDoc(doc(db, "Chatrooms", chatId, "messages", messageId), {
        mediaUrl: result.url,
      });
    } else {
      await deleteDoc(doc(db, "Chatrooms", chatId, "messages", messageId));
      alert("Upload failed");
    }

    setUploading(false);
    setMenuOpen(false);
    e.target.value = "";
  };

  const canSend = value.trim().length > 0;

  return (
    <div
      style={{
        width: "100%",
        padding: "10px 16px 16px",
        background: N.header,
        borderTop: `1px solid ${N.divider}`,
        position: "relative",
      }}
    >
      {/* Upload progress */}
      {uploading && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            right: 0,
            height: "2px",
            background: N.border,
          }}
        >
          <div
            style={{
              width: `${uploadProgress}%`,
              height: "100%",
              background: N.accent,
              transition: "width 0.3s ease",
            }}
          />
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          background: N.surface,
          border: `1px solid ${canSend ? N.borderFocus : N.border}`,
          borderRadius: 12,
          padding: "8px 8px 8px 14px",
          transition: "border-color 0.15s ease",
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder={uploading ? "Uploading image..." : "Type a message…"}
          rows={1}
          disabled={uploading}
          className="scrollbar-none"
          style={{
            flex: 1,
            minWidth: 0,
            background: "none",
            border: "none",
            outline: "none",
            resize: "none",
            color: N.textPrimary,
            fontSize: 14,
            lineHeight: 1.5,
            fontFamily: "inherit",
            minHeight: 28,
            overflow: "hidden",
            opacity: uploading ? 0.5 : 1,
          }}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend || uploading}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            flexShrink: 0,
            background: canSend && !uploading ? N.accent : N.surfaceHover,
            border: "none",
            cursor: canSend && !uploading ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: canSend && !uploading ? 1 : 0.4,
            transition: "background 0.15s ease, opacity 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (canSend && !uploading)
              e.currentTarget.style.background = N.accentHover;
          }}
          onMouseLeave={(e) => {
            if (canSend && !uploading)
              e.currentTarget.style.background = N.accent;
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: 15, height: 15 }}
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>

        {/* Attachment button */}
        <button
          onClick={() => {
            if (!uploading) setMenuOpen((prev) => !prev);
          }}
          disabled={uploading}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            flexShrink: 0,
            background: N.surfaceHover,
            border: "none",
            cursor: uploading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: uploading ? 0.4 : 1,
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (!uploading) e.currentTarget.style.background = N.borderFocus;
          }}
          onMouseLeave={(e) => {
            if (!uploading) e.currentTarget.style.background = N.surfaceHover;
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={N.icon}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={frontRef}
        type="file"
        accept="image/*"
        capture="user"
        style={{ display: "none" }}
        onChange={handleFileCapture}
      />
      <input
        ref={rearRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={handleFileCapture}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileCapture}
      />

      {/* Attachment menu */}
      {menuOpen && !uploading && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            right: 16,
            background: N.surface,
            border: `1px solid ${N.border}`,
            borderRadius: 12,
            padding: 4,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            minWidth: 180,
            zIndex: 50,
          }}
        >
          {[
            {
              label: "Selfie",
              sub: "Front camera",
              icon: (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={N.icon}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              ),
              onClick: () => frontRef.current.click(),
            },
            {
              label: "Rear camera",
              sub: "Back camera",
              icon: (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={N.icon}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                  <circle cx="18" cy="9" r="1.2" fill={N.icon} stroke="none" />
                </svg>
              ),
              onClick: () => rearRef.current.click(),
            },
            {
              divider: true,
            },
            {
              label: "Gallery / File",
              sub: "Photos only",
              icon: (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={N.icon}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              ),
              onClick: () => galleryRef.current.click(),
            },
          ].map((item, i) =>
            item.divider ? (
              <div
                key={i}
                style={{ height: 1, background: N.border, margin: "2px 6px" }}
              />
            ) : (
              <button
                key={i}
                onClick={item.onClick}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                  background: "transparent",
                  fontFamily: "inherit",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = N.surfaceHover)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: N.surfaceHover,
                    border: `1px solid ${N.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 1 }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: N.textPrimary,
                      lineHeight: 1.3,
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: N.textMuted,
                      lineHeight: 1.3,
                    }}
                  >
                    {item.sub}
                  </span>
                </div>
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

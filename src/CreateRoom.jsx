import { useEffect, useRef, useState, useCallback } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import {
  doc,
  updateDoc,
  serverTimestamp,
  getFirestore,
  addDoc,
  collection,
} from "firebase/firestore";

const db = getFirestore();

/* ─── Design tokens ─── */
const N = {
  bg: "#09090b",
  surface: "#18181b",
  surfaceHover: "#27272a",
  border: "#27272a",
  textPrimary: "#fafafa",
  textSecondary: "#a1a1aa",
  textMuted: "#52525b",
  danger: "#ef4444",
  dangerHover: "#dc2626",
  success: "#22c55e",
};

/* ─── Icons ─── */
const MicOnIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-1.5 14.95A7.002 7.002 0 0 1 5 9H3a9 9 0 0 0 8 8.94V21H9v2h6v-2h-2v-3.05A9 9 0 0 0 21 9h-2a7 7 0 0 1-5.5 6.95z" />
  </svg>
);
const MicOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M17 11c0 .34-.03.67-.08 1H19c.05-.33.08-.66.08-1V9h-2v2zm-5-9a4 4 0 0 1 4 4v1.17l1.41 1.41A5.97 5.97 0 0 0 18 7V5a6 6 0 0 0-11.5-2.38l1.48 1.48A4 4 0 0 1 12 2zm-7.39-.27L3.27 3.07 8 7.8V11a4 4 0 0 0 7.28 2.28l1.43 1.43A5.975 5.975 0 0 1 13 16.92V21h-2v-4.08A7 7 0 0 1 5 10H3c0 3.31 2.28 6.08 5.38 6.81L3.27 21.93l1.41 1.41 16-16L19.14.86 4.61 1.73z" />
  </svg>
);
const CamOnIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z" />
  </svg>
);
const CamOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M21 6.5l-4 4V7a1 1 0 0 0-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z" />
  </svg>
);
const EndCallIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.67 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.996.996 0 0 1-.29-.7c0-.28.11-.53.29-.71C3.34 8.77 7.46 7 12 7s8.66 1.77 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.1-.7-.28a11.27 11.27 0 0 0-2.67-1.85.996.996 0 0 1-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
  </svg>
);

/* ─── Remote video tile ─── */
const RemoteTile = ({ uid, videoTrack, callType }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || callType === "voice") return;
    if (videoTrack) videoTrack.play(ref.current);
    return () => {
      videoTrack?.stop();
    };
  }, [videoTrack, callType]);

  const hasVideo = callType !== "voice" && !!videoTrack;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        background: N.bg,
      }}
    >
      <div
        ref={ref}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          inset: 0,
          display: hasVideo ? "block" : "none",
        }}
      />
      {!hasVideo && (
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              background: N.surface,
              border: `1px solid ${N.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{ color: N.textSecondary, fontSize: 36, fontWeight: 600 }}
            >
              {uid?.toString().slice(0, 1).toUpperCase() || "?"}
            </span>
          </div>
          <p style={{ color: N.textMuted, fontSize: 13, fontWeight: 500 }}>
            {callType === "voice" ? "Connected" : "Camera off"}
          </p>
        </div>
      )}
    </div>
  );
};

/* ─── Main Component ─── */
const CreateRoom = ({
  roomID,
  userID,
  userName,
  callType,
  callerID,
  calleeID,
  onClose,
}) => {
  const client = useRef(null);

  const [joined, setJoined] = useState(false);
  const [error, setError] = useState(null);
  const [duration, setDuration] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(callType !== "voice");
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [controlsVisible, setControlsVisible] = useState(true);

  const localVideoRef = useRef(null);
  const localAudioTrack = useRef(null);
  const localVideoTrack = useRef(null);
  const timerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const leaveGraceTimerRef = useRef(null);
  const durationRef = useRef(0);
  const remoteUsersRef = useRef([]);
  const hasWrittenHistory = useRef(false);
  // Tracks whether THIS mount actually completed agoraClient.join().
  // Prevents a StrictMode phantom mount/cleanup from writing "ended"
  // to Firestore before the real join has a chance to happen.
  const hasActuallyJoined = useRef(false);

  const otherUID = roomID.replace(userID, "");

  const updateRemoteUsers = useCallback((updater) => {
    setRemoteUsers((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      remoteUsersRef.current = next;
      return next;
    });
  }, []);

  const formatDuration = (s) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 4000);
  }, []);

  /* ════════════════════════════════════════
     LEAVE — handles cleanup + history write
     Called on: end button, page refresh,
     component unmount, remote user leaves
  ════════════════════════════════════════ */
  const leave = useCallback(
    async (callOnClose = true) => {
      clearInterval(timerRef.current);
      clearTimeout(hideTimerRef.current);
      clearTimeout(leaveGraceTimerRef.current);

      if (localAudioTrack.current) {
        localAudioTrack.current.stop();
        localAudioTrack.current.close();
        localAudioTrack.current = null;
      }
      if (localVideoTrack.current) {
        localVideoTrack.current.stop();
        localVideoTrack.current.close();
        localVideoTrack.current = null;
      }

      if (client.current) {
        client.current.removeAllListeners();
        if (client.current.connectionState !== "DISCONNECTED") {
          await client.current.leave();
        }
      }

      /* ── Firestore writes only happen if THIS mount actually joined.
         A StrictMode phantom mount/cleanup never got past join(), so
         it must be a silent no-op here — otherwise it marks the call
         "ended" before the real join ever runs. ── */
      if (hasActuallyJoined.current && !hasWrittenHistory.current) {
        hasWrittenHistory.current = true;
        try {
          if (durationRef.current > 0) {
            await addDoc(collection(db, "CallHistory"), {
              roomID,
              callerID: callerID || userID,
              callType,
              duration: durationRef.current,
              participants: [otherUID, userID].filter(Boolean),
              status: "answered",
              timestamp: serverTimestamp(),
            });
          }
          await updateDoc(doc(db, "Calls", roomID), { status: "ended" });
        } catch (e) {
          console.error("CreateRoom: failed to save call history:", e);
        }
      }

      setJoined(false);
      updateRemoteUsers([]);
      if (callOnClose) onClose();
    },
    [onClose, roomID, userID, callerID, callType, otherUID, updateRemoteUsers]
  );

  /* ════════════════════════════════════════
     JOIN + AGORA SETUP
  ════════════════════════════════════════ */
  useEffect(() => {
    let cancelled = false;

    const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    client.current = agoraClient;

    const handleTabClose = () => leave(false);
    window.addEventListener("beforeunload", handleTabClose);
    window.addEventListener("unload", handleTabClose);

    const join = async () => {
      try {
        if (agoraClient.connectionState !== "DISCONNECTED") {
          await agoraClient.leave();
        }
        agoraClient.removeAllListeners();

        if (cancelled) return;

        agoraClient.on("user-published", async (user, mediaType) => {
          await agoraClient.subscribe(user, mediaType);

          // A peer publishing means they're actually here — cancel any
          // pending "no remote users" hangup timer from a transient drop.
          clearTimeout(leaveGraceTimerRef.current);

          if (mediaType === "audio") {
            user.audioTrack?.play();
            updateRemoteUsers((prev) =>
              prev.some((u) => u.uid === user.uid)
                ? prev
                : [
                    ...prev,
                    {
                      uid: user.uid,
                      videoTrack: null,
                      audioTrack: user.audioTrack,
                    },
                  ]
            );
          }
          if (mediaType === "video") {
            updateRemoteUsers((prev) =>
              prev.map((u) =>
                u.uid === user.uid ? { ...u, videoTrack: user.videoTrack } : u
              )
            );
          }
        });

        agoraClient.on("user-unpublished", (user, mediaType) => {
          if (mediaType === "video") {
            updateRemoteUsers((prev) =>
              prev.map((u) =>
                u.uid === user.uid ? { ...u, videoTrack: null } : u
              )
            );
          }
        });

        agoraClient.on("user-left", (user) => {
          updateRemoteUsers((prev) => {
            const updated = prev.filter((u) => u.uid !== user.uid);
            if (updated.length === 0) {
              // Grace period instead of an instant hangup — gives a
              // peer who refreshed/dropped a real window to rejoin
              // before we tear the call down for good.
              clearTimeout(leaveGraceTimerRef.current);
              leaveGraceTimerRef.current = setTimeout(() => {
                if (remoteUsersRef.current.length === 0) {
                  leave(true);
                }
              }, 3000);
            }
            return updated;
          });
        });

        const tokenRes = await fetch(
          `https://agora-token-server-y71i.onrender.com/token?channelName=${roomID}&uid=0`
        );
        const { token } = await tokenRes.json();

        if (cancelled) return;

        await agoraClient.join(
          "d64197858a084b8dbe1f3d8fbf1dd101",
          roomID,
          token,
          0
        );

        if (cancelled) {
          // We joined Agora but this effect run was cancelled
          // (e.g. StrictMode phantom mount) before we could publish.
          // Leave quietly without touching Firestore.
          await agoraClient.leave();
          return;
        }

        localAudioTrack.current = await AgoraRTC.createMicrophoneAudioTrack();
        if (callType !== "voice") {
          localVideoTrack.current = await AgoraRTC.createCameraVideoTrack();
          await agoraClient.publish([
            localAudioTrack.current,
            localVideoTrack.current,
          ]);
        } else {
          await agoraClient.publish([localAudioTrack.current]);
        }

        if (cancelled) return;

        hasActuallyJoined.current = true;
        setJoined(true);
        timerRef.current = setInterval(() => {
          setDuration((d) => {
            const next = d + 1;
            durationRef.current = next;
            return next;
          });
        }, 1000);
      } catch (err) {
        if (cancelled) return;
        console.error("Agora join error:", err);
        setError(err.message || "Failed to join call.");
      }
    };

    join();

    return () => {
      cancelled = true;
      leave(false);
      window.removeEventListener("beforeunload", handleTabClose);
      window.removeEventListener("unload", handleTabClose);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomID, callType]);

  useEffect(() => {
    if (joined && localVideoTrack.current && localVideoRef.current) {
      localVideoTrack.current.play(localVideoRef.current);
    }
  }, [joined]);

  const toggleMic = async () => {
    if (localAudioTrack.current) {
      await localAudioTrack.current.setEnabled(!micOn);
      setMicOn((v) => !v);
    }
    resetHideTimer();
  };

  const toggleCam = async () => {
    if (localVideoTrack.current) {
      await localVideoTrack.current.setEnabled(!camOn);
      setCamOn((v) => !v);
    }
    resetHideTimer();
  };

  /* ─── Styles ─── */
  const btnBase = {
    width: 56,
    height: 56,
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "opacity 0.15s ease, background 0.15s ease",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        overflow: "hidden",
        background: N.bg,
      }}
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
    >
      {/* Remote Video / Waiting Area */}
      <div style={{ position: "absolute", inset: 0 }}>
        {remoteUsers.length > 0 ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "grid",
              gridTemplateColumns:
                remoteUsers.length > 1 ? "repeat(2, 1fr)" : "1fr",
            }}
          >
            {remoteUsers.map((u) => (
              <RemoteTile
                key={u.uid}
                uid={u.uid}
                videoTrack={u.videoTrack}
                callType={callType}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: N.bg,
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
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  background: N.surface,
                  border: `1px solid ${N.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {(userName || "?").charAt(0).toUpperCase()}
              </div>
              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    color: N.textPrimary,
                    fontWeight: 600,
                    fontSize: 18,
                    margin: 0,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {userName || "You"}
                </p>
                <p
                  style={{
                    color: N.textMuted,
                    fontSize: 14,
                    marginTop: 6,
                    fontWeight: 500,
                  }}
                >
                  {joined ? "Waiting for partner…" : "Connecting…"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Local Video PiP */}
      {callType !== "voice" && joined && (
        <div
          style={{
            position: "absolute",
            bottom: 120,
            right: 16,
            width: 120,
            height: 160,
            borderRadius: 12,
            overflow: "hidden",
            zIndex: 20,
            border: `1px solid ${N.border}`,
            background: N.bg,
          }}
        >
          <div
            ref={localVideoRef}
            style={{ width: "100%", height: "100%", background: "#000" }}
          />
          {!camOn && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CamOffIcon />
            </div>
          )}
        </div>
      )}

      {/* Top bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "16px 20px 32px",
          opacity: controlsVisible ? 1 : 0,
          transition: "opacity 0.5s ease",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)",
        }}
      >
        <div>
          <p
            style={{
              color: N.textPrimary,
              fontWeight: 600,
              fontSize: 15,
              margin: 0,
            }}
          >
            {callType === "voice" ? "Voice Call" : "Video Call"}
          </p>
          <p
            style={{
              color: N.textMuted,
              fontSize: 12,
              fontFamily: "monospace",
              marginTop: 4,
            }}
          >
            {joined ? formatDuration(duration) : "Connecting…"}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            borderRadius: 20,
            background: N.surface,
            border: `1px solid ${N.border}`,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: joined ? N.success : N.textMuted,
              display: "inline-block",
            }}
          />
          <span
            style={{ color: N.textSecondary, fontSize: 11, fontWeight: 500 }}
          >
            {joined ? "Live" : "Joining"}
          </span>
        </div>
      </div>

      {/* Bottom controls */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          padding: "32px 24px 40px",
          opacity: controlsVisible ? 1 : 0,
          transition: "opacity 0.5s ease",
          background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
        }}
      >
        {/* Mic */}
        <button
          onClick={toggleMic}
          style={{
            ...btnBase,
            background: micOn ? N.surfaceHover : "rgba(239,68,68,0.15)",
            color: micOn ? N.textPrimary : N.danger,
            border: `1px solid ${micOn ? N.border : "rgba(239,68,68,0.3)"}`,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          {micOn ? <MicOnIcon /> : <MicOffIcon />}
        </button>

        {/* End call */}
        <button
          onClick={() => leave(true)}
          style={{
            ...btnBase,
            width: 64,
            height: 64,
            background: N.danger,
            color: "#fff",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = N.dangerHover)
          }
          onMouseLeave={(e) => (e.currentTarget.style.background = N.danger)}
        >
          <EndCallIcon />
        </button>

        {/* Cam */}
        {callType !== "voice" && (
          <button
            onClick={toggleCam}
            style={{
              ...btnBase,
              background: camOn ? N.surfaceHover : "rgba(239,68,68,0.15)",
              color: camOn ? N.textPrimary : N.danger,
              border: `1px solid ${camOn ? N.border : "rgba(239,68,68,0.3)"}`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {camOn ? <CamOnIcon /> : <CamOffIcon />}
          </button>
        )}
      </div>

      {/* Error overlay */}
      {error && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.85)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              textAlign: "center",
              padding: 32,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "rgba(239,68,68,0.1)",
                border: `1px solid rgba(239,68,68,0.2)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <EndCallIcon />
            </div>
            <p
              style={{
                color: N.textPrimary,
                fontWeight: 600,
                fontSize: 18,
                margin: 0,
              }}
            >
              Connection Error
            </p>
            <p
              style={{
                color: N.textMuted,
                fontSize: 14,
                maxWidth: 280,
                margin: 0,
              }}
            >
              {error}
            </p>
            <button
              onClick={() => leave(true)}
              style={{
                marginTop: 8,
                padding: "10px 28px",
                borderRadius: 10,
                border: "none",
                background: N.danger,
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = N.dangerHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = N.danger)
              }
            >
              Close Call
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateRoom;

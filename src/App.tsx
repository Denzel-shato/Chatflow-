import { Route, Routes } from 'react-router-dom'
import './App.css'
import Home from './components/Home'
import NotFound from './components/NotFound'
import Login from './components/Login'
import Messages from './components/Nested Routes/Messages'
import Calls from './components/Nested Routes/Calls'
import Settings from './components/Nested Routes/Settings'
import Status from './components/Nested Routes/Status'
import { useEffect, useRef, useState, useCallback } from "react";
import SignUp from './components/SignUp'
import Chat from './components/Chat'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getDatabase, onDisconnect, onValue, ref, set, serverTimestamp } from 'firebase/database'
import { doc, onSnapshot, updateDoc, collection } from 'firebase/firestore'
import { db } from './Firebase/firebase'
import VideoCall from './CreateRoom'
import MyCall from './components/MyCall'
import { AppUserData, CalleeInfo, IncomingCall } from '@schema/Apptsx'
import {
  requestNotificationPermission,
  listenForegroundMessages,
} from "./components/fcm";
import ChatFlowLogo from '@components/ChatFlowLogo'

function App() {
  const [user, setUser]                   = useState('')
  const [incomingCall, setIncomingCall]   = useState<IncomingCall | null>(null)
  const [inCall, setInCall]               = useState<boolean>(false)
  const [userData, setUserData]           = useState<AppUserData|null>(null)
  const ringtoneRef                       = useRef<HTMLAudioElement | null>(null)
  const [callRoomId, setCallRoomId]       = useState<string | null>(null)
  const [callTypeState, setCallTypeState] = useState<string | null>(null)
  const fcmRegistered                     = useRef<boolean>(false)
  const [myCall, setMyCall]               = useState<boolean>(false)
  const [calleeInfo, setCalleeInfo]       = useState<CalleeInfo | null>(null)

  /* ── Service worker ── */
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    let isMounted = true
    navigator.serviceWorker.getRegistration().then((existing) => {
      if (!existing && isMounted) {
        navigator.serviceWorker.register('/firebase-messaging-sw.js')
          .then(reg => console.log('✅ SW registered:', reg))
          .catch(err => console.error('❌ SW registration failed:', err))
      }
    })
    return () => { isMounted = false }
  }, [])

  /* ── Auth + FCM ── */
  useEffect(() => {
    const auth = getAuth()
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) return
      setUser(firebaseUser.uid)
      setUserData(firebaseUser)
      if (!fcmRegistered.current) {
        fcmRegistered.current = true
        setTimeout(() => requestNotificationPermission(firebaseUser.uid, db), 1000)
      }
    })
    return () => unsub()
  }, [])

  /* ── Presence ── */
  useEffect(() => {
    if (!user) return
    const rtdb         = getDatabase()
    const userRef      = ref(rtdb, `status/${user}`)
    const connectedRef = ref(rtdb, '.info/connected')
    onValue(connectedRef, (snap) => {
      if (!snap.val()) return
      onDisconnect(userRef).set({ state: 'offline', lastSeen: serverTimestamp() })
      set(userRef, { state: 'online', lastSeen: serverTimestamp() })
    })
  }, [user])

  /* ── Incoming call detector (collection-level) ── */
  // Responsibilities:
  //   1. Detect a new incoming call for the callee
  //   2. Reset UI on any terminal status (missed/declined/cancelled/ended)
  // It does NOT write anything to Firestore — each status is written by its actor.
  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(collection(db, 'Calls'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type !== 'added' && change.type !== 'modified') return
        const data = change.doc.data()

        // Someone is calling YOU
        if (
          data.callerId !== user &&
          data.status   === 'calling' &&
          change.doc.id.includes(user)
        ) {
          setIncomingCall({ ...data, chatRoomId: change.doc.id } as IncomingCall)
        }

        // Any terminal status on a call involving you → reset all UI state
        if (
          change.doc.id.includes(user) &&
          ['missed', 'declined', 'cancelled', 'ended'].includes(data.status)
        ) {
          setIncomingCall(null)
          setInCall(false)
          setMyCall(false)
          setCalleeInfo(null)
        }
      })
    })
    return () => unsub()
  }, [user])

  /* ── Outgoing call doc listener (scoped to active call room) ── */
  useEffect(() => {
    if (!callRoomId || !user) return

    const unsub = onSnapshot(doc(db, 'Calls', callRoomId), (snap) => {
      if (!snap.exists()) return
      const data = snap.data()

      if (data.callerId !== user) return

      if (data.status === 'calling') {
        setMyCall(true)
      }

      if (data.status === 'accepted') {
        setIncomingCall(prev => ({ ...prev, chatRoomId: callRoomId } as IncomingCall))
        setInCall(true)
        setMyCall(false)
      }

      if (['missed', 'declined', 'cancelled', 'ended'].includes(data.status)) {
        setMyCall(false)
        setInCall(false)
        setIncomingCall(null)
        setCalleeInfo(null)
      }
    })

    return () => unsub()
  }, [callRoomId, user])

  /* ── Ringtone ── */
  useEffect(() => {
    if (incomingCall && !inCall) {
      ringtoneRef.current = new Audio('/ringtone.mp3')
      ringtoneRef.current.loop = true
      ringtoneRef.current.play().catch(() => {})
    } else {
      ringtoneRef.current?.pause()
      ringtoneRef.current = null
    }
  }, [incomingCall, inCall])

  const [toast, setToast] = useState<{ title: string; body: string } | null>(
    null
  );

  // Foreground pushes (app open + tab focused) — FCM won't auto-show these,
  // so render your own toast.
  useEffect(() => {
    if (!user) return;
    let unsub: (() => void) | undefined;
    listenForegroundMessages((payload) => {
      const data = payload.data || {};
      if (data.type === "call_cancelled") return; // nothing to show

      // Skip toasting a message notification for the chat the user is
      // already looking at — avoids a redundant popup.
      if (data.type === "message" && data.chatId === callRoomId) return;

      setToast({
        title: payload.notification?.title || "Notification",
        body: payload.notification?.body || "",
      });
      setTimeout(() => setToast(null), 4000);
    }).then((fn) => {
      unsub = fn;
    });
    return () => unsub?.();
  }, [user, callRoomId]);

  // Clicking a background notification posts a message from the service
  // worker — use it to route within the SPA instead of a full page load.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const handler = (event: MessageEvent) => {
      if (event.data?.type !== "NOTIFICATION_CLICK") return;
      const data = event.data.data || {};
      if (data.type === "message" && data.chatId) {
        // e.g. navigate('/Messages') then open that chatId — wire this up
        // to however your Messages component picks its active chat.
        window.location.href = `/Messages?chatId=${data.chatId}`;
      }
      // Incoming calls are already driven by your Firestore 'Calls'
      // listener — once the tab is focused, the existing onSnapshot
      // in this file picks up the 'calling' status and shows the
      // incoming-call UI on its own. No extra routing needed here.
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () =>
      navigator.serviceWorker.removeEventListener("message", handler);
  }, []);

  /* ── Callee: accept ── */
  // if (!incomingCall) return ;
  const acceptCall = async () => {
    const callDocRef = doc(db, 'Calls', incomingCall.chatRoomId)
    await updateDoc(callDocRef, { status: 'accepted' })
    setInCall(true)
  }

  /* ── Callee: decline — writes 'declined', nothing else ── */
  const declineCall = async () => {
    const callDocRef = doc(db, 'Calls', incomingCall.chatRoomId)
    await updateDoc(callDocRef, { status: 'declined' })
    setIncomingCall(null)
  }

    const handleMyCallCancel = () => {
      setMyCall(false);
      setCallRoomId(null);
      setCallTypeState(null);
      setCalleeInfo(null);
    };

    // stable reference — prevents CreateRoom's join effect from
    // re-running just because App re-rendered
    const handleCallClose = useCallback(() => {
      setInCall(false);
      setIncomingCall(null);
      setCallRoomId(null);
      setCallTypeState(null);
      setCalleeInfo(null);
    }, []);
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/SignUp" element={<SignUp />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/" element={<Chat />}>
          <Route
            path="/Messages"
            element={
              <Messages
                setGlobalInCall={setInCall}
                setGlobalCallRoomId={setCallRoomId}
                setGlobalCallType={setCallTypeState}
                setGlobalCalleeInfo={setCalleeInfo}
              />
            }
          />
          <Route path="/Calls" element={<Calls />} />
          <Route path="/Settings" element={<Settings />} />
          <Route path="/Status" element={<Status />} />
        </Route>
      </Routes>
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            zIndex: 60,
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            background: "#18181b",
            border: "1px solid #27272a",
            borderRadius: 12,
            padding: "12px 16px",
            maxWidth: 320,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          <ChatFlowLogo size="sm" mark={false} />
          <div>
            <p
              style={{
                color: "#fafafa",
                fontWeight: 600,
                fontSize: 14,
                margin: 0,
              }}
            >
              {toast.title}
            </p>
            <p
              style={{
                color: "#a1a1aa",
                fontSize: 13,
                marginTop: 4,
                marginBottom: 0,
              }}
            >
              {toast.body}
            </p>
          </div>
        </div>
      )}

      {/* ── Incoming call UI (callee side) ── */}
      {incomingCall && !inCall && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#09090b",
            padding: 24,
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: "50%",
              background: "#18181b",
              border: "1px solid #27272a",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <img
              src={incomingCall.callerPhoto || "/profile.png"}
              alt={incomingCall.callerName}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          {/* Name */}
          <p
            style={{
              color: "#fafafa",
              fontSize: 24,
              fontWeight: 600,
              marginTop: 24,
              marginBottom: 0,
              letterSpacing: "-0.02em",
              textAlign: "center",
            }}
          >
            {incomingCall.callerName}
          </p>

          {/* Status */}
          <p
            style={{
              color: "#52525b",
              fontSize: 15,
              fontWeight: 500,
              marginTop: 8,
              marginBottom: 0,
            }}
          >
            {incomingCall.callType === "video"
              ? "Incoming video call"
              : "Incoming voice call"}
          </p>

          {/* Action buttons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              marginTop: "auto",
              marginBottom: 40,
            }}
          >
            {/* Decline */}
            <button
              onClick={declineCall}
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "#ef4444",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "opacity 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Accept */}
            <button
              onClick={acceptCall}
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "#22c55e",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "opacity 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.02 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Outgoing call screen (caller side) ── */}
      {myCall && (
        <MyCall
          calleeName={calleeInfo?.name || ""}
          calleePhoto={calleeInfo?.photoURL || ""}
          callType={callTypeState}
          chatRoomId={callRoomId}
          user={user}
          setIncomingCall={setIncomingCall}
          onCancel={handleMyCallCancel}
        />
      )}

      {/* ── Active call screen ── */}
      {inCall && userData?.uid && (
        <div className="absolute inset-0 z-50">
          <VideoCall
            roomID={incomingCall?.chatRoomId || callRoomId}
            userID={userData.uid}
            userName={userData.displayName || userData.email}
            callType={incomingCall?.callType || callTypeState}
            callerID={incomingCall?.callerId || userData.uid}
            calleeID={incomingCall?.callerId ? userData.uid : calleeInfo?.uid}
            onClose={handleCallClose}
          />
        </div>
      )}
    </>
  );
}

export default App
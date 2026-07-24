import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { getDatabase, onValue, ref } from "firebase/database";

import ChatSideBar from "../ChatSideBar";
import ChatHeader from "../ChatHeader";
import MessageList from "../Messagelist";
import GrowingTextarea from "./SendMessageComp";
import ChatFlowLogo from "../ChatFlowLogo";
import useUserContacts from "../../Messages customHooks/userContacts";
import useChatroom from "../../Messages customHooks/CurrentChatroom-and-RT-presence";
import useMessagesListerner from "../../Messages customHooks/Messages-Listener";
import {
  UserDataType,
  ParticipantsData,
  UserChat,
} from "src/schema/MessageTypes";
import { CalleeInfo } from "@schema/Apptsx";
const db = getFirestore();

/* ── Design tokens ── */
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
};

/* ── Welcome screen ── */
function WelcomeScreen() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: T.bg,
      }}
      className="hidden md:flex"
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
            width: "auto",
            height: 72,
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px 20px",
          }}
        >
          <ChatFlowLogo size="lg" />
        </div>
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              color: T.textPrimary,
              fontWeight: 600,
              fontSize: 15,
              letterSpacing: "-0.01em",
            }}
          >
            Welcome to ChatFlow
          </p>
          <p style={{ color: T.textTertiary, fontSize: 13, marginTop: 6 }}>
            Select a chat to start Chatting
          </p>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
type AuthType = {
  uid: string;
};

export let _cachedUserData: UserDataType | null = null;
export let _authUser: AuthType | null = null;

export const setCachedUserData = (data: UserDataType | null) => {
  _cachedUserData = data;
};

export const setAuthUser = (data: UserDataType | null) => {
  _authUser = data;
};

type PropTypes = {
  setGlobalInCall: Dispatch<SetStateAction<boolean>>;
  setGlobalCallRoomId: Dispatch<SetStateAction<string | null>>;
  setGlobalCallType: Dispatch<SetStateAction<string | null>>;
  setGlobalCalleeInfo: Dispatch<SetStateAction<CalleeInfo | null>>;
};

export default function Messages({
  setGlobalInCall,
  setGlobalCallRoomId,
  setGlobalCallType,
  setGlobalCalleeInfo,
}: PropTypes) {
  /* ── Auth + profiles ── */
  const [user, setUser] = useState(() => _authUser ?? getAuth().currentUser);
  const [uid, setUid] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserDataType[]>(() =>
    _cachedUserData ? [_cachedUserData] : []
  );
  /* ── Active chat ── */
  const [view, setView] = useState("welcome"); // 'welcome' | 'chat'
  const [chatId, setChatId] = useState("");
  const [otherUserData, setOtherUserData] = useState<ParticipantsData | null>(
    null
  );
  const [contactsUid, setContactsUid] = useState("");

  const { data, isLoading, isError } = useUserContacts();
  const chats: RoomType[] = data ?? [];
  const { response, status } = useChatroom({ chatId, uid, contactsUid });
  const userChat: UserChat[] = response ?? [];
  const { messages } = useMessagesListerner({ chatId });
  const noChats = !isLoading && chats.length === 0 ? "No chats yet" : "";

  /* ── UI state ── */
  const [callsDropdown, setCallsDropdown] = useState<boolean>(false);

  /* ─────────────────────────────────────────
     1. Auth listener
  ───────────────────────────────────────── */
  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), (u) => {
      _authUser = u;
      if (u) {
        setUser(u);
        setUid(u.uid);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    if (_cachedUserData) return;

    const load = async () => {
      const snap = await getDoc(doc(db, "Users", user.uid));
      if (snap.exists()) {
        _cachedUserData = snap.data() as UserDataType;
        setUserData([snap.data() as UserDataType]);
      }
    };
    load();
  }, [user]);

  /* ─────────────────────────────────────────
     3. Listen to chatroom list
  ───────────────────────────────────────── */

  /* ─────────────────────────────────────────
     4. Listen to active chatroom doc + presence
  ───────────────────────────────────────── */

  /* ─────────────────────────────────────────
     5. Listen to messages
  ───────────────────────────────────────── */

  /* ─────────────────────────────────────────
     6. Mark messages as read
  ───────────────────────────────────────── */
  type MsgType = {
    senderId: string;
    readBy: string[];
    messageId: string;
  };
  useEffect(() => {
    if (!chatId || userData.length === 0) return;
    messages.forEach(async (msg: MsgType) => {
      if (
        msg.senderId !== userData[0].uid &&
        !msg.readBy?.includes(userData[0].uid)
      ) {
        await updateDoc(
          doc(db, "Chatrooms", chatId, "messages", msg.messageId),
          {
            readBy: arrayUnion(userData[0].uid),
          }
        );
      }
    });
  }, [messages, chatId]);

  /* ─────────────────────────────────────────
     7. Incoming call listener
  ───────────────────────────────────────── */
  useEffect(() => {
    if (!chatId || userData.length === 0) return;

    const unsub = onSnapshot(doc(db, "Calls", chatId), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (data.callerId !== userData[0].uid && data.status === "calling") {
        // bubble up to global incoming call handler
      }
      if (data.status === "ended") {
        setGlobalInCall?.(false);
      }
    });

    return () => unsub();
  }, [chatId]);

  /* ─────────────────────────────────────────
     8. Track active chat — lets the notification
     Cloud Function skip pushing a message alert
     for a chat the user is already looking at.
  ───────────────────────────────────────── */
  useEffect(() => {
    const currentUid = userData[0]?.uid;
    if (!currentUid || !chatId) return;

    updateDoc(doc(db, "Users", currentUid), { activeChatId: chatId }).catch(
      () => {}
    );

    // Clear it when this chat closes or a different one opens, so a stale
    // "still viewing" flag doesn't silently swallow future notifications.
    return () => {
      updateDoc(doc(db, "Users", currentUid), { activeChatId: null }).catch(
        () => {}
      );
    };
  }, [chatId, userData]);

  // Best-effort clear on tab close — not 100% guaranteed to complete
  // before the tab actually closes, but covers the common case.
  useEffect(() => {
    const currentUid = userData[0]?.uid;
    if (!currentUid) return;

    const clearOnUnload = () => {
      updateDoc(doc(db, "Users", currentUid), { activeChatId: null }).catch(
        () => {}
      );
    };
    window.addEventListener("beforeunload", clearOnUnload);
    return () => window.removeEventListener("beforeunload", clearOnUnload);
  }, [userData]);

  /* ─────────────────────────────────────────
     Actions
  ───────────────────────────────────────── */

  type RoomType = {
    participantsInfo: ParticipantsData[];
    uid: string;
    chatId: string;
  };

  const toChat = (id: string) => {
    setChatId(id);
    setView("chat");
    const room: RoomType | undefined = chats?.find((c) => c.chatId === id);
    const user = userData?.[0]?.uid;
    if (room && user) {
      const other = room.participantsInfo.find((p) => p.uid !== user)!;
      setOtherUserData(other);
      setContactsUid(other?.uid);
      console.log(other.uid);
    }
  };

  const toSearchedChat = async (other: ParticipantsData) => {
    if (!userData[0]?.uid) {
      console.warn("toSearchedChat called before userData was ready");
      return;
    }
    const ids = [other.uid, userData[0].uid].sort();
    const id = `${ids[0]}${ids[1]}`;

    const normalisedOther = {
      ...other,
      name: other.displayName || other.name,
      displayName: other.displayName || other.name,
    };

    setOtherUserData(normalisedOther);
    setView("chat");

    const q = query(
      collection(db, "Chatrooms"),
      where("chatId", "==", id),
      where("participants", "array-contains", userData[0].uid)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      await setDoc(doc(db, "Chatrooms", id), {
        participants: [other.uid, userData[0].uid],
        participantsInfo: [
          {
            name: userData[0].displayName,
            photoURL: userData[0].photoURL || "",
            uid: userData[0].uid,
            unreadCount: 0,
            lastSeen: null,
          },
          {
            name: other.displayName || other.name,
            photoURL: other.photoURL || "",
            uid: other.uid,
            unreadCount: 0,
            lastSeen: null,
          },
        ],
        chatId: id,
        createdAt: serverTimestamp(),
        lastMessage: null,
        lastMessageAt: null,
      });
    }

    const unsub = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) return;
      setChatId(id);
      unsub();
    });
  };

  const backToChats = () => {
    setView("welcome");
    setChatId("");
    setOtherUserData(null);
  };

  const startCall = async (callType: string) => {
    await setDoc(doc(db, "Calls", chatId), {
      callerId: userData[0].uid,
      calleeId: otherUserData?.uid,
      callerName: userData[0].displayName,
      callerPhoto: userData[0].photoURL,
      status: "calling",
      callType,
    });
    setGlobalCallRoomId?.(chatId);
    setGlobalCallType?.(callType);
    setGlobalCalleeInfo?.({
      name: otherUserData?.name || otherUserData?.displayName || "",
      photoURL: otherUserData?.photoURL || "",
    });
  };

  /* ─────────────────────────────────────────
     Render
  ───────────────────────────────────────── */

  /* ── guards ── */
  if (userData.length === 0) {
    return (
      <div
        style={{
          height: "100dvh",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: T.bg,
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
              animation: "spin 0.8s linear infinite",
            }}
          />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const chatOpen = view === "chat" && chatId;

  const isTyping = userChat?.[0]?.typing?.[contactsUid] === true;
  console.log(isTyping);

  return (
    <div
      style={{
        position: "relative",
        height: "100dvh",
        width: "100%",
        display: "flex",
        background: T.bg,
        overflow: "hidden",
      }}
    >
      {/* ── Sidebar ── */}
      <div
        className={`
        shrink-0 w-full md:w-[320px] lg:w-[360px] h-full
        ${chatOpen ? "hidden md:flex" : "flex"}
        flex-col
      `}
      >
        <ChatSideBar
          userData={userData}
          chats={chats}
          noChats={noChats}
          isLoading={isLoading}
          db={db}
          onChatSelect={toChat}
          onSearchedChatSelect={toSearchedChat}
        />
      </div>

      {/* ── Divider ── */}
      <div
        className="hidden md:block"
        style={{ width: 1, background: T.border, flexShrink: 0 }}
      />

      {/* ── Chat panel ── */}
      <div
        className={`
        flex-1 flex flex-col h-full min-w-0
        ${chatOpen ? "flex" : "hidden md:flex"}
      `}
      >
        {chatOpen ? (
          <>
            <ChatHeader
              otherUser={otherUserData}
              status={status}
              callsDropdown={callsDropdown}
              setCallsDropdown={setCallsDropdown}
              onBack={backToChats}
              onStartCall={startCall}
            />

            <MessageList
              messages={messages}
              userData={userData}
              userChat={userChat}
              contactsUid={contactsUid}
              isTyping={isTyping}
            />

            <GrowingTextarea
              userData={userData}
              chatId={chatId}
              db={db}
              otherUserdata={otherUserData}
            />
          </>
        ) : (
          <WelcomeScreen />
        )}
      </div>
    </div>
  );
}

const {
  onDocumentCreated,
  onDocumentUpdated,
} = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const logger = require("firebase-functions/logger");

initializeApp();
const db = getFirestore();
const messaging = getMessaging();

/* ════════════════════════════════════════════════
   SHARED HELPER — send to every token a user has,
   and prune any tokens that have gone stale/invalid.

   `skipIfActiveChatId` — if provided, and the recipient's
   Users/{uid}.activeChatId matches it, the notification is
   skipped entirely (they're already looking at that chat).

   NOTE: payload is DATA-ONLY on purpose (no top-level
   `notification` key). The service worker's onBackgroundMessage
   is the single place that calls showNotification — if we also
   send a `notification` field here, the browser auto-displays
   ANOTHER notification on top of that one, which is what was
   causing the duplicate/paired notifications.
════════════════════════════════════════════════ */ async function sendToUser(
  uid,
  { notification, data },
  skipIfActiveChatId
) {
  const userSnap = await db.collection("Users").doc(uid).get();
  if (!userSnap.exists) {
    logger.warn(`sendToUser: no Users/${uid} doc`);
    return;
  }

  const userData = userSnap.data();

  if (skipIfActiveChatId && userData.activeChatId === skipIfActiveChatId) {
    logger.log(
      `sendToUser: skipping ${uid} — actively viewing chat ${skipIfActiveChatId}`
    );
    return;
  }

  const tokens = [...new Set(userData.fcmTokens || [])];
  if (tokens.length === 0) {
    logger.log(`sendToUser: ${uid} has no fcmTokens`);
    return;
  }

  const message = {
    tokens,
    notification,
    data,
    android: { priority: "high" },
    apns: {
      headers: { "apns-priority": "10" },
      payload: { aps: { sound: "default", "content-available": 1 } },
    },
    webpush: {
      fcmOptions: {
        link: "/",
      },
    },
  };

  const response = await messaging.sendEachForMulticast(message);

  const staleTokens = [];
  response.responses.forEach((res, i) => {
    if (!res.success) {
      const code = res.error?.code;
      if (
        code === "messaging/invalid-registration-token" ||
        code === "messaging/registration-token-not-registered"
      ) {
        staleTokens.push(tokens[i]);
      } else {
        logger.warn(`sendToUser: send failed for ${uid}`, res.error);
      }
    }
  });

  if (staleTokens.length > 0) {
    await db
      .collection("Users")
      .doc(uid)
      .update({
        fcmTokens: FieldValue.arrayRemove(...staleTokens),
      });
    logger.log(
      `sendToUser: pruned ${staleTokens.length} stale token(s) for ${uid}`
    );
  }
}

/* ════════════════════════════════════════════════
   NEW MESSAGE → notify every participant except sender
   Trigger path assumes: Chatrooms/{chatId}/messages/{messageId}
════════════════════════════════════════════════ */
exports.onNewMessage = onDocumentCreated(
  {
    document: "Chatrooms/{chatId}/messages/{messageId}",
    maxInstances: 10,
  },
  async (event) => {
    const message = event.data?.data();
    if (!message) return;

    const { chatId } = event.params;
    const { senderId, text, type } = message;
    if (!senderId) {
      logger.warn(
        `onNewMessage: message ${event.params.messageId} has no senderId`
      );
      return;
    }

    const chatSnap = await db.collection("Chatrooms").doc(chatId).get();
    if (!chatSnap.exists) return;

    // Adjust this field name if your Chatrooms doc stores participants differently
    const participants = chatSnap.data().participants || [];
    const recipients = participants.filter((uid) => uid !== senderId);
    if (recipients.length === 0) return;

    const senderSnap = await db.collection("Users").doc(senderId).get();
    const senderName = senderSnap.exists
      ? senderSnap.data().displayName || "New message"
      : "New message";

    const body =
      type === "image"
        ? "📷 Sent a photo"
        : type === "text"
        ? text?.slice(0, 120) || ""
        : "Sent a message";

    await Promise.all(
      recipients.map((uid) =>
        sendToUser(
          uid,
          {
            notification: { title: senderName, body },
            data: {
              type: "message",
              chatId,
              senderId,
            },
          },
          chatId // skip if recipient's activeChatId === this chat
        ).catch((e) => logger.error(`onNewMessage: failed for ${uid}`, e))
      )
    );
  }
);

/* ════════════════════════════════════════════════
   INCOMING CALL → notify the callee when a call doc
   is created with status "calling"
   Trigger path: Calls/{roomId}
   Requires explicit callerId + calleeId fields on the doc.
════════════════════════════════════════════════ */
exports.onNewCall = onDocumentCreated(
  {
    document: "Calls/{roomId}",
    maxInstances: 10,
  },
  async (event) => {
    const call = event.data?.data();
    if (!call || call.status !== "calling") return;

    const { roomId } = event.params;
    const { callerId, calleeId, callType, callerName, callerPhoto } = call;

    if (!calleeId) {
      logger.warn(
        `onNewCall: Calls/${roomId} has no calleeId field — add one when creating the call doc so the Cloud Function knows who to notify.`
      );
      return;
    }

    await sendToUser(calleeId, {
      notification: {
        title: callerName || "Incoming call",
        body:
          callType === "voice" ? "Incoming voice call" : "Incoming video call",
      },
      data: {
        type: "call",
        roomId,
        callerId: callerId || "",
        callType: callType || "video",
        callerName: callerName || "",
        callerPhoto: callerPhoto || "",
      },
    }).catch((e) => logger.error(`onNewCall: failed for ${calleeId}`, e));
  }
);

/* ════════════════════════════════════════════════
   CALL ENDED BEFORE ANSWERED → tell the callee's device
   to dismiss the ringing notification (data-only, silent).
   Fires when status flips from "calling" to a terminal state
   before it ever reached "accepted".
════════════════════════════════════════════════ */
exports.onCallCancelled = onDocumentUpdated(
  {
    document: "Calls/{roomId}",
    maxInstances: 10,
  },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!before || !after) return;

    const terminal = ["missed", "declined", "cancelled", "ended"];
    const wasRinging = before.status === "calling";
    const nowTerminal = terminal.includes(after.status);

    if (!wasRinging || !nowTerminal) return;

    const { calleeId } = after;
    if (!calleeId) return;

    const userSnap = await db.collection("Users").doc(calleeId).get();
    if (!userSnap.exists) return;
    const tokens = [...new Set(userSnap.data().fcmTokens || [])];
    if (tokens.length === 0) return;

    // Data-only message — no `notification` key, so it won't pop a new
    // banner; your service worker/app uses this to clear the existing one.
    await messaging.sendEachForMulticast({
      tokens,
      data: {
        type: "call_cancelled",
        roomId: event.params.roomId,
      },
      android: { priority: "high" },
      apns: {
        headers: { "apns-priority": "10" },
        payload: { aps: { "content-available": 1 } },
      },
    });
  }
);

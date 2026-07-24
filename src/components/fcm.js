import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { doc, updateDoc, setDoc, arrayUnion } from "firebase/firestore";

// Get this from Firebase Console → Project Settings → Cloud Messaging
// → Web configuration → "Web Push certificates" → Key pair.
const VAPID_KEY ="BHrFkKJE6XFIZBfvhhm93zoYufKq_8gObfeC24vQXQR4VajSv66SkCPUlNRQHgCzyfrnil-sg4pIlmmC8qiU85s";

let messagingInstance = null;

async function getMessagingIfSupported() {
  if (messagingInstance) return messagingInstance;
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;
  messagingInstance = getMessaging();
  return messagingInstance;
}

/**
 * Requests notification permission, retrieves an FCM token, and stores it
 * on Users/{uid}.fcmTokens (an array, so a user can have multiple devices).
 * Safe to call every time the app loads — it dedupes via arrayUnion.
 */
export async function requestNotificationPermission(uid, db) {
  try {
    const messaging = await getMessagingIfSupported();
    if (!messaging) {
      console.warn("FCM not supported in this browser/context.");
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission not granted:", permission);
      return null;
    }

    // Reuse the service worker App.tsx already registers at
    // /firebase-messaging-sw.js, rather than registering a second one.
    const registration = await navigator.serviceWorker.getRegistration();

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.warn("No FCM token retrieved.");
      return null;
    }

    // merge:true so this works whether or not the Users/{uid} doc exists yet
    await setDoc(
      doc(db, "Users", uid),
      { fcmTokens: arrayUnion(token) },
      { merge: true }
    );

    return token;
  } catch (err) {
    console.error("requestNotificationPermission failed:", err);
    return null;
  }
}

/**
 * Removes the current device's token — call this on logout so a signed-out
 * device stops receiving pushes meant for that account.
 */
export async function removeNotificationToken(uid, db) {
  try {
    const messaging = await getMessagingIfSupported();
    if (!messaging) return;
    const registration = await navigator.serviceWorker.getRegistration();
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    if (!token) return;

    const { arrayRemove } = await import("firebase/firestore");
    await updateDoc(doc(db, "Users", uid), {
      fcmTokens: arrayRemove(token),
    });
  } catch (err) {
    console.error("removeNotificationToken failed:", err);
  }
}

/**
 * Foreground listener — FCM does NOT show a system notification when the
 * tab is focused, so the app has to handle it manually (in-app toast, etc).
 * Call this once from App.tsx and pass a callback to render your own UI.
 * Returns an unsubscribe function.
 */
export async function listenForegroundMessages(onNotification) {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    onNotification(payload);
  });
}
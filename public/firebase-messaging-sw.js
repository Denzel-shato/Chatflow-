/* eslint-disable no-undef */

/* This service worker intentionally does NOT import/initialize the Firebase
   SDK. Calling firebase.messaging() here registers its own internal "push"
   listener, which fires alongside the one below and caused duplicate/
   inconsistent notifications. We only need to handle raw push events and
   notification clicks, so no SDK is required for that. */

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    return;
  }

  const data = payload.data || {};
  const notification = payload.notification || {};

  // call_cancelled is a silent data-only message used to dismiss an
  // existing ringing notification — don't show a new banner for it.
  if (data.type === "call_cancelled") {
    event.waitUntil(
      self.registration
        .getNotifications({ tag: `call-${data.roomId}` })
        .then((notifications) => {
          notifications.forEach((n) => n.close());
        })
    );
    return;
  }

  const title = notification.title || data.title || "New notification";
  const body = notification.body || data.body || "";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/logo192.png", // adjust to your app icon
      tag: data.type === "call" ? `call-${data.roomId}` : `msg-${data.chatId}`,
      data,
      requireInteraction: data.type === "call", // keep call notifications visible until acted on
    })
  );
});

/* Take control immediately on activation so a redeploy doesn't leave an
   old version of this worker lingering alongside the new one. */
self.addEventListener("install", () => {
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/* Click handling — focus an existing tab if one is open, else open a new one */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};

  let targetUrl = "/";
  if (data.type === "message" && data.chatId) {
    targetUrl = `/Messages?chatId=${data.chatId}`;
  } else if (data.type === "call" && data.roomId) {
    targetUrl = `/?incomingRoomId=${data.roomId}`;
  }

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if ("focus" in client) {
            client.postMessage({ type: "NOTIFICATION_CLICK", data });
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

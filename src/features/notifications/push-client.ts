import {
  fetchPushConfig,
  subscribePush,
  unsubscribePush,
} from "./preferences-api";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function ensurePushServiceWorker() {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.register("/sw.js", {
    updateViaCache: "none",
  });
  void reg.update();
  return reg;
}

export async function getBrowserPushState(): Promise<{
  supported: boolean;
  permission: NotificationPermission | "unsupported";
  subscribed: boolean;
}> {
  if (!isPushSupported()) {
    return {
      supported: false,
      permission: "unsupported",
      subscribed: false,
    };
  }

  await ensurePushServiceWorker();
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return {
    supported: true,
    permission: Notification.permission,
    subscribed: Boolean(sub),
  };
}

export async function enableBrowserPush() {
  if (!isPushSupported()) {
    throw new Error("Este navegador não suporta notificações push.");
  }

  const config = await fetchPushConfig();
  if (!config.enabled || !config.publicKey) {
    throw new Error(
      "Push ainda não está configurado no servidor (VAPID).",
    );
  }

  await ensurePushServiceWorker();
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Permissão de notificação negada no navegador.");
  }

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(config.publicKey),
    });
  }

  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error("Assinatura push incompleta.");
  }

  await subscribePush({
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    userAgent: navigator.userAgent,
  });

  return true;
}

export async function disableBrowserPush() {
  if (!isPushSupported()) return;
  await ensurePushServiceWorker();
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  await sub.unsubscribe().catch(() => undefined);
  await unsubscribePush(endpoint).catch(() => undefined);
}

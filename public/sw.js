/* elloot-sw v2 — push UI com marca */
const DEFAULTS = {
  title: "Elloot",
  body: "Nova notificação",
  href: "/dashboard/notifications",
  tag: "elloot",
  icon: "/icons/notification-192.png",
  badge: "/icons/notification-badge.png",
  image: "/icons/notification-banner.png",
};

self.addEventListener("push", (event) => {
  let data = { ...DEFAULTS };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch {
    // keep defaults
  }

  const title = data.title || DEFAULTS.title;
  const options = {
    body: data.body || "",
    tag: data.tag || DEFAULTS.tag,
    icon: data.icon || DEFAULTS.icon,
    badge: data.badge || DEFAULTS.badge,
    image: data.image || DEFAULTS.image,
    renotify: true,
    vibrate: [120, 40, 120],
    requireInteraction: Boolean(data.requireInteraction),
    actions: [
      { action: "open", title: "Abrir" },
      { action: "dismiss", title: "Dispensar" },
    ],
    data: {
      href: data.href || DEFAULTS.href,
    },
  };

  // Alguns browsers ignoram image; se vier vazio no payload, não força banner
  if (data.image === null || data.image === false) {
    delete options.image;
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  const action = event.action;
  event.notification.close();

  if (action === "dismiss") return;

  const href =
    (event.notification.data && event.notification.data.href) ||
    DEFAULTS.href;
  const url = new URL(href, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      }),
  );
});

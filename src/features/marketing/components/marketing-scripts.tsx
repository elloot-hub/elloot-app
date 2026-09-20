"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  readMarketingConsent,
  resolveMarketingTags,
  type ResolvedMarketingTag,
} from "@/features/marketing/api";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
    ttq?: { load: (id: string) => void; page: () => void; track: (e: string, p?: object) => void };
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type MarketingEvent =
  | { name: "page_view" }
  | { name: "view_content"; listingId?: string; valueCents?: number }
  | {
      name: "purchase";
      listingId?: string;
      valueCents?: number;
      currency?: string;
      orderId?: string;
    };

type Props = {
  listingId?: string | null;
  /** When set, fire this event once tags are loaded. */
  event?: MarketingEvent;
  /** Which resolved scopes to inject. Default: both. */
  includeScopes?: Array<"platform" | "listing">;
  /** CSP nonce from middleware (required in production). */
  nonce?: string;
};

function uniqueTags(tags: ResolvedMarketingTag[]) {
  const seen = new Set<string>();
  const out: ResolvedMarketingTag[] = [];
  for (const tag of tags) {
    const id = `${tag.key}:${tag.scope}:${JSON.stringify(tag.config)}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(tag);
  }
  return out;
}

/** Client-side allowlist — must match API validators. Never inject raw. */
const CLIENT_ID_RE: Record<string, RegExp> = {
  facebook_pixel: /^\d{5,20}$/,
  tiktok_pixel: /^[A-Z0-9]{10,40}$/i,
  google_ads: /^AW-\d{6,15}$/,
  google_tag_manager: /^GTM-[A-Z0-9]{4,12}$/i,
  google_analytics: /^G-[A-Z0-9]{6,14}$/i,
};

function safeId(key: string, value: string | undefined): string | null {
  if (!value) return null;
  const re = CLIENT_ID_RE[key];
  if (!re || !re.test(value)) return null;
  if (/[<>`"';\\]/.test(value)) return null;
  return value;
}

/** Embed as a JS string literal (prevents quote breakout). */
function jsStr(value: string): string {
  return JSON.stringify(value);
}

function fireEvents(tags: ResolvedMarketingTag[], event: MarketingEvent) {
  const value =
    "valueCents" in event && typeof event.valueCents === "number"
      ? event.valueCents / 100
      : undefined;
  const currency =
    "currency" in event && event.currency ? event.currency : "BRL";

  for (const tag of tags) {
    if (tag.key === "facebook_pixel" && typeof window.fbq === "function") {
      if (event.name === "page_view") window.fbq("track", "PageView");
      if (event.name === "view_content") {
        window.fbq("track", "ViewContent", {
          content_ids: event.listingId ? [event.listingId] : undefined,
          content_type: "product",
          value,
          currency,
        });
      }
      if (event.name === "purchase") {
        window.fbq("track", "Purchase", {
          value,
          currency,
          content_ids: event.listingId ? [event.listingId] : undefined,
          content_type: "product",
        });
      }
    }

    if (tag.key === "tiktok_pixel" && window.ttq) {
      if (event.name === "page_view") window.ttq.page();
      if (event.name === "view_content") {
        window.ttq.track("ViewContent", {
          content_id: event.listingId,
          value,
          currency,
        });
      }
      if (event.name === "purchase") {
        window.ttq.track("CompletePayment", {
          content_id: event.listingId,
          value,
          currency,
        });
      }
    }

    if (
      (tag.key === "google_analytics" || tag.key === "google_ads") &&
      typeof window.gtag === "function"
    ) {
      if (event.name === "page_view") {
        window.gtag("event", "page_view");
      }
      if (event.name === "view_content") {
        window.gtag("event", "view_item", {
          currency,
          value,
          items: event.listingId
            ? [{ item_id: event.listingId }]
            : undefined,
        });
      }
      if (event.name === "purchase") {
        window.gtag("event", "purchase", {
          transaction_id: event.orderId,
          currency,
          value,
          items: event.listingId
            ? [{ item_id: event.listingId }]
            : undefined,
        });
      }
    }
  }
}

export function MarketingScripts({
  listingId,
  event,
  includeScopes = ["platform", "listing"],
  nonce,
}: Props) {
  const [consent, setConsent] = useState<"granted" | "denied" | null>(null);
  const [tags, setTags] = useState<ResolvedMarketingTag[]>([]);
  const firedRef = useRef<string | null>(null);

  useEffect(() => {
    setConsent(readMarketingConsent());
    function onChange() {
      setConsent(readMarketingConsent());
    }
    window.addEventListener("elloot:marketing-consent", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("elloot:marketing-consent", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const scopeKey = includeScopes.slice().sort().join(",");

  useEffect(() => {
    if (consent !== "granted") {
      setTags([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const { tags: next } = await resolveMarketingTags({ listingId });
        if (!cancelled) {
          const allowed = new Set(scopeKey.split(",") as Array<"platform" | "listing">);
          setTags(uniqueTags(next).filter((t) => allowed.has(t.scope)));
        }
      } catch {
        if (!cancelled) setTags([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [consent, listingId, scopeKey]);

  const onReady = useCallback(() => {
    if (!event || tags.length === 0) return;
    const key = `${event.name}:${listingId ?? ""}:${JSON.stringify(tags.map((t) => t.key))}`;
    if (firedRef.current === key) return;
    firedRef.current = key;
    // Small delay so provider bootstraps finish
    window.setTimeout(() => fireEvents(tags, event), 200);
  }, [event, listingId, tags]);

  useEffect(() => {
    if (consent === "granted" && tags.length > 0) onReady();
  }, [consent, tags, onReady]);

  if (consent !== "granted" || tags.length === 0) return null;

  const fb = tags.filter((t) => t.key === "facebook_pixel");
  const tt = tags.filter((t) => t.key === "tiktok_pixel");
  const gtm = tags.filter((t) => t.key === "google_tag_manager");
  const ga = tags.filter((t) => t.key === "google_analytics");
  const ads = tags.filter((t) => t.key === "google_ads");

  return (
    <>
      {fb.map((tag) => {
        const pixelId = safeId("facebook_pixel", tag.config.pixelId);
        if (!pixelId) return null;
        return (
          <Script
            key={`fb-${tag.scope}-${pixelId}`}
            id={`fb-pixel-${tag.scope}-${pixelId}`}
            strategy="afterInteractive"
            nonce={nonce}
            dangerouslySetInnerHTML={{
              __html: `
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init',${jsStr(pixelId)});
fbq('track','PageView');
              `.trim(),
            }}
            onLoad={onReady}
          />
        );
      })}

      {tt.map((tag) => {
        const pixelId = safeId("tiktok_pixel", tag.config.pixelId);
        if (!pixelId) return null;
        return (
          <Script
            key={`tt-${tag.scope}-${pixelId}`}
            id={`tt-pixel-${tag.scope}-${pixelId}`}
            strategy="afterInteractive"
            nonce={nonce}
            dangerouslySetInnerHTML={{
              __html: `
!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;
ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};
n=document.createElement("script");n.type="text/javascript";n.async=!0;n.src=r+"?sdkid="+e+"&lib="+t;
e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
ttq.load(${jsStr(pixelId)});ttq.page();}(window,document,'ttq');
              `.trim(),
            }}
            onLoad={onReady}
          />
        );
      })}

      {gtm.map((tag) => {
        // GTM is platform-only; still harden ID embedding.
        if (tag.scope !== "platform") return null;
        const containerId = safeId(
          "google_tag_manager",
          tag.config.containerId,
        );
        if (!containerId) return null;
        return (
          <Script
            key={`gtm-${tag.scope}-${containerId}`}
            id={`gtm-${tag.scope}-${containerId}`}
            strategy="afterInteractive"
            nonce={nonce}
            dangerouslySetInnerHTML={{
              __html: `
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer',${jsStr(containerId)});
              `.trim(),
            }}
            onLoad={onReady}
          />
        );
      })}

      {(ga.length > 0 || ads.length > 0) && (
        <Script
          id="gtag-base"
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js"
          nonce={nonce}
          onLoad={onReady}
        />
      )}
      {(ga.length > 0 || ads.length > 0) && (
        <Script
          id="gtag-config"
          strategy="afterInteractive"
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());
${ga
  .map((t) => {
    const id = safeId("google_analytics", t.config.measurementId);
    return id ? `gtag('config',${jsStr(id)});` : "";
  })
  .join("\n")}
${ads
  .map((t) => {
    const id = safeId("google_ads", t.config.conversionId);
    return id ? `gtag('config',${jsStr(id)});` : "";
  })
  .join("\n")}
            `.trim(),
          }}
          onLoad={onReady}
        />
      )}
    </>
  );
}

/** Fire Purchase once (used from order paid flow). */
export async function trackMarketingPurchase(input: {
  listingId: string;
  orderId: string;
  valueCents: number;
  currency?: string;
}) {
  if (readMarketingConsent() !== "granted") return;
  try {
    const { tags } = await resolveMarketingTags({ listingId: input.listingId });
    fireEvents(uniqueTags(tags), {
      name: "purchase",
      listingId: input.listingId,
      orderId: input.orderId,
      valueCents: input.valueCents,
      currency: input.currency ?? "BRL",
    });
  } catch {
    /* ignore */
  }
}

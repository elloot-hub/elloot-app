"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** Builds a data-URL QR from PIX copia-e-cola (or any payload string). */
export function usePixQrDataUrl(
  payload: string | null | undefined,
  fallbackImage?: string | null,
) {
  const [dataUrl, setDataUrl] = useState<string | null>(fallbackImage ?? null);
  const [loading, setLoading] = useState(Boolean(payload) && !fallbackImage);

  useEffect(() => {
    if (fallbackImage) {
      setDataUrl(fallbackImage);
      setLoading(false);
      return;
    }
    if (!payload) {
      setDataUrl(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void QRCode.toDataURL(payload, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 240,
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) {
          setDataUrl(url);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDataUrl(null);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [payload, fallbackImage]);

  return { dataUrl, loading };
}

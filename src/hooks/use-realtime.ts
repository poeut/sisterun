"use client";

import { useEffect, useRef } from "react";

// Hook unifié temps réel : Pusher si dispo, sinon polling.
// On préfère Pusher quand la variable publique de clé est définie.
export function useRealtime<T = unknown>(opts: {
  channel: string;
  event: string;
  pollUrl?: string; // appelée toutes les pollIntervalMs si Pusher indispo
  pollIntervalMs?: number;
  onEvent: (data: T) => void;
}) {
  const onEventRef = useRef(opts.onEvent);
  onEventRef.current = opts.onEvent;

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "eu";
    let cleanup: () => void = () => {};

    if (key) {
      // Pusher
      let cancelled = false;
      import("pusher-js").then((mod) => {
        if (cancelled) return;
        const Pusher = mod.default;
        const client = new Pusher(key, { cluster });
        const ch = client.subscribe(opts.channel);
        ch.bind(opts.event, (data: T) => onEventRef.current(data));
        cleanup = () => {
          ch.unbind(opts.event);
          client.unsubscribe(opts.channel);
          client.disconnect();
        };
      });
      return () => {
        cancelled = true;
        cleanup();
      };
    }

    // Fallback polling
    if (!opts.pollUrl) return;
    let stopped = false;
    let lastSig = "";
    const tick = async () => {
      try {
        const res = await fetch(opts.pollUrl!, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const sig = JSON.stringify(data);
        if (sig !== lastSig) {
          lastSig = sig;
          onEventRef.current(data as T);
        }
      } catch {
        // ignore transient
      }
    };
    tick();
    const id = window.setInterval(() => {
      if (!stopped) tick();
    }, opts.pollIntervalMs ?? 3000);
    return () => {
      stopped = true;
      window.clearInterval(id);
    };
  }, [opts.channel, opts.event, opts.pollUrl, opts.pollIntervalMs]);
}

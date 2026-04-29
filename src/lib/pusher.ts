// Couche Pusher avec fallback : si pas de clé API, on log côté serveur et on
// ne broadcast rien — les clients fonctionnent en polling automatiquement.
// MOCK PROTOTYPE : sans clé Pusher, l'app reste 100 % fonctionnelle via polling.

import Pusher from "pusher";

let serverInstance: Pusher | null = null;

export function getPusherServer(): Pusher | null {
  if (
    !process.env.PUSHER_APP_ID ||
    !process.env.PUSHER_SECRET ||
    !process.env.NEXT_PUBLIC_PUSHER_KEY
  ) {
    return null;
  }
  if (serverInstance) return serverInstance;
  serverInstance = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.NEXT_PUBLIC_PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "eu",
    useTLS: true,
  });
  return serverInstance;
}

export async function broadcast(
  channel: string,
  event: string,
  payload: unknown
) {
  const p = getPusherServer();
  if (!p) {
    // Fallback : juste un log dev. Les clients vont récupérer via polling.
    if (process.env.NODE_ENV !== "production") {
      console.log(`[pusher mock] ${channel} ← ${event}`, payload);
    }
    return;
  }
  try {
    await p.trigger(channel, event, payload);
  } catch (e) {
    console.error("[pusher] broadcast error", e);
  }
}

export const PUSHER_ENABLED =
  !!process.env.NEXT_PUBLIC_PUSHER_KEY && !!process.env.PUSHER_SECRET;

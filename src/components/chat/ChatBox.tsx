"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRealtime } from "@/hooks/use-realtime";
import { initials, formatTime } from "@/lib/utils";

type Msg = {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; photoUrl: string | null };
};

export function ChatBox({
  runId,
  currentUserId,
}: {
  runId: string;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Charge initial
  useEffect(() => {
    fetch(`/api/runs/${runId}/messages`)
      .then((r) => r.json())
      .then((d) => setMessages(d.messages || []))
      .catch(() => {
        /* noop */
      });
  }, [runId]);

  // Realtime — Pusher si dispo, sinon polling
  useRealtime<{ message?: Msg; messages?: Msg[] }>({
    channel: `run-${runId}`,
    event: "chat-message",
    pollUrl: `/api/runs/${runId}/messages`,
    pollIntervalMs: 3000,
    onEvent: (data) => {
      if (data.messages) {
        setMessages(data.messages);
      } else if (data.message) {
        setMessages((prev) =>
          prev.find((m) => m.id === data.message!.id) ? prev : [...prev, data.message!]
        );
      }
    },
  });

  // Auto-scroll bas
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content) return;
    setSending(true);
    setInput("");
    const res = await fetch(`/api/runs/${runId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setSending(false);
    if (!res.ok) {
      toast.error("Impossible d'envoyer le message.");
      setInput(content);
      return;
    }
    const { message } = await res.json();
    setMessages((prev) =>
      prev.find((m) => m.id === message.id) ? prev : [...prev, message]
    );
  };

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card">
      <div
        ref={scrollRef}
        className="flex max-h-72 min-h-[180px] flex-col gap-2 overflow-y-auto p-3"
      >
        {messages.length === 0 ? (
          <p className="my-auto text-center text-xs text-muted-foreground">
            Pas encore de message. Lance la conversation 👋
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.user.id === currentUserId;
            return (
              <div
                key={m.id}
                className={
                  "flex max-w-[85%] gap-2 " + (mine ? "ml-auto flex-row-reverse" : "")
                }
              >
                {!mine ? (
                  <Avatar className="h-7 w-7 shrink-0">
                    {m.user.photoUrl ? (
                      <AvatarImage src={m.user.photoUrl} alt={m.user.firstName} />
                    ) : null}
                    <AvatarFallback className="text-[10px]">
                      {initials(m.user.firstName, m.user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                ) : null}
                <div>
                  {!mine ? (
                    <p className="text-[10px] text-muted-foreground">
                      {m.user.firstName}
                    </p>
                  ) : null}
                  <div
                    className={
                      "rounded-2xl px-3 py-2 text-sm " +
                      (mine
                        ? "bg-brand-500 text-white"
                        : "bg-secondary text-foreground")
                    }
                  >
                    {m.content}
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {formatTime(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={send} className="flex items-center gap-2 border-t border-border p-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ton message…"
          className="flex h-11 flex-1 rounded-xl border border-input bg-background px-3 text-sm"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white disabled:opacity-50"
          aria-label="Envoyer"
        >
          {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </button>
      </form>
    </div>
  );
}

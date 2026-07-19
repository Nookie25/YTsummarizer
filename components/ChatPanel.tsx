"use client";

import { useEffect, useRef, useState } from "react";
import Markdown from "@/components/Markdown";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What are the main takeaways?",
  "Was anything surprising or counterintuitive?",
  "What would the speaker say to a skeptic?",
];

export default function ChatPanel({
  title,
  author,
  transcript,
  onSeek,
}: {
  title: string;
  author: string;
  transcript: string;
  onSeek: (seconds: number) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Reset the conversation when the video changes
  useEffect(() => {
    setMessages([]);
    setError(null);
    abortRef.current?.abort();
  }, [transcript]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const send = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || isStreaming) return;
    setError(null);
    setInput("");

    const history: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author, transcript, messages: history }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `Chat failed (HTTP ${res.status}).`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let reply = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        const current = reply;
        setMessages([...history, { role: "assistant", content: current }]);
      }
      if (!reply.trim()) {
        setMessages(history);
        throw new Error("The model returned an empty reply. Please try again.");
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setMessages(history);
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={scrollRef}
        className="panel-scroll min-h-0 flex-1 space-y-4 overflow-y-auto pr-2"
      >
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-start justify-center gap-4 py-6">
            <p className="font-display text-xl italic text-cream-dim">
              Ask anything about this video…
            </p>
            <div className="flex flex-col items-start gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-line px-3.5 py-1.5 text-left text-[13px] text-cream-dim transition-colors hover:border-line-strong hover:text-cream"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => {
          const isLast = i === messages.length - 1;
          const streamingThis = isStreaming && isLast && msg.role === "assistant";
          return msg.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-xl rounded-br-sm bg-raised px-3.5 py-2.5 text-[14px] leading-relaxed text-cream">
                {msg.content}
              </div>
            </div>
          ) : (
            <div key={i} className="max-w-[95%]">
              <div className={streamingThis ? "stream-caret" : undefined}>
                {msg.content ? (
                  <Markdown text={msg.content} onSeek={onSeek} />
                ) : streamingThis ? (
                  <span className="font-mono text-xs text-muted">thinking…</span>
                ) : null}
              </div>
            </div>
          );
        })}
        {error && (
          <p className="rounded-lg border border-signal/30 bg-signal/5 px-3 py-2 text-[13px] text-cream-dim">
            {error}
          </p>
        )}
      </div>

      <form
        className="mt-3 flex shrink-0 gap-2 border-t border-line pt-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the video…"
          className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3.5 py-2.5 text-[14px] text-cream placeholder:text-muted focus:border-line-strong focus:outline-none"
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="rounded-lg bg-signal px-4 py-2.5 text-[14px] font-medium text-ink transition-colors hover:bg-signal-deep disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isStreaming ? "…" : "Ask"}
        </button>
      </form>
    </div>
  );
}

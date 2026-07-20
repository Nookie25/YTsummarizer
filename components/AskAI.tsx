"use client";

import { useEffect, useRef, useState } from "react";
import { ChatMarkdown } from "@/components/Inline";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What are the main takeaways?",
  "Was anything surprising or counterintuitive?",
  "What would the speaker say to a skeptic?",
];

export default function AskAI({
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
    <div className="card flex h-[560px] flex-col overflow-hidden">
      <div
        ref={scrollRef}
        className="panel-scroll min-h-0 flex-1 space-y-5 overflow-y-auto p-6"
      >
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-start justify-center gap-5">
            <p className="text-[17px] font-medium text-text2">
              Ask anything about this video.
            </p>
            <div className="flex flex-col items-start gap-2.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-line bg-white/[0.02] px-4 py-2 text-left text-[13px] text-text2 transition-all hover:border-line-bright hover:bg-white/[0.05] hover:text-text"
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
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-indigo/15 px-4 py-2.5 text-[14px] leading-relaxed text-text">
                {msg.content}
              </div>
            </div>
          ) : (
            <div key={i} className="max-w-[95%]">
              <div className={streamingThis ? "stream-caret" : undefined}>
                {msg.content ? (
                  <ChatMarkdown text={msg.content} onSeek={onSeek} />
                ) : streamingThis ? (
                  <span className="pulse-soft font-mono text-[12px] text-muted">
                    thinking…
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
        {error && (
          <p role="alert" className="rounded-xl border border-error/25 bg-error/[0.06] px-4 py-2.5 text-[13px] text-text2">
            {error}
          </p>
        )}
      </div>

      <form
        className="flex shrink-0 gap-2.5 border-t border-line bg-white/[0.015] p-4"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the video…"
          aria-label="Ask a question about the video"
          className="min-w-0 flex-1 rounded-xl border border-line bg-bg2 px-4 py-2.5 text-[14px] text-text placeholder:text-muted focus:border-indigo/50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="btn-primary !rounded-xl !px-5 !py-2.5 text-[14px]"
        >
          {isStreaming ? "…" : "Ask"}
        </button>
      </form>
    </div>
  );
}

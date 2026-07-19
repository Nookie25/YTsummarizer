"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { transcriptToText, type TranscriptSegment } from "@/lib/format";
import UrlInput from "@/components/UrlInput";
import VideoPlayer, { type VideoPlayerHandle } from "@/components/VideoPlayer";
import TranscriptPanel from "@/components/TranscriptPanel";
import SummaryPanel from "@/components/SummaryPanel";
import ChatPanel from "@/components/ChatPanel";

interface VideoData {
  videoId: string;
  title: string;
  author: string;
  thumbnail: string;
  segments: TranscriptSegment[];
  source: "direct" | "supadata";
}

function Wordmark() {
  return (
    <span className="flex items-baseline gap-2 whitespace-nowrap">
      <span className="rec-dot inline-block h-2 w-2 self-center rounded-full bg-signal" />
      <span className="font-display text-xl tracking-tight text-cream">
        Reel<em className="italic text-signal">notes</em>
      </span>
    </span>
  );
}

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [video, setVideo] = useState<VideoData | null>(null);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const [summary, setSummary] = useState("");
  const [summaryStreaming, setSummaryStreaming] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [tab, setTab] = useState<"summary" | "chat">("summary");

  const playerRef = useRef<VideoPlayerHandle>(null);
  const summaryAbortRef = useRef<AbortController | null>(null);
  const loadedIdRef = useRef<string | null>(null);

  const transcriptText = useMemo(
    () => (video ? transcriptToText(video.segments) : ""),
    [video],
  );

  const runSummarize = useCallback(
    async (data: VideoData, text: string) => {
      summaryAbortRef.current?.abort();
      const controller = new AbortController();
      summaryAbortRef.current = controller;

      setSummary("");
      setSummaryError(null);
      setSummaryStreaming(true);
      try {
        const res = await fetch("/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: data.title,
            author: data.author,
            transcript: text,
          }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error ?? `Summarization failed (HTTP ${res.status}).`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          const current = acc;
          setSummary(current);
        }
        if (!acc.trim()) {
          throw new Error("The model returned an empty summary. Please try again.");
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setSummaryError(err instanceof Error ? err.message : "Something went wrong.");
        }
      } finally {
        if (summaryAbortRef.current === controller) setSummaryStreaming(false);
      }
    },
    [],
  );

  const loadVideo = useCallback(
    async (url: string) => {
      setInputError(null);
      setLoadingTranscript(true);
      try {
        const res = await fetch("/api/transcript", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Couldn't fetch that video.");

        const videoData = data as VideoData;
        loadedIdRef.current = videoData.videoId;
        setVideo(videoData);
        setTab("summary");
        router.replace(`/?v=${videoData.videoId}`, { scroll: false });
        void runSummarize(videoData, transcriptToText(videoData.segments));
      } catch (err) {
        setInputError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoadingTranscript(false);
      }
    },
    [router, runSummarize],
  );

  // Deep link: /?v=<videoId>
  useEffect(() => {
    const v = searchParams.get("v");
    if (v && v !== loadedIdRef.current && !loadingTranscript) {
      loadedIdRef.current = v;
      void loadVideo(v);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const seek = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds);
    if (window.innerWidth < 1024) window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /* ---------------- Hero (no video loaded) ---------------- */
  if (!video) {
    return (
      <main className="relative mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center px-6 py-16">
        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-[-20%] h-[60vh] w-[80vw] -translate-x-1/2 rounded-full bg-signal/[0.07] blur-[120px]" />
        </div>

        <div className="rise w-full text-center" style={{ animationDelay: "0ms" }}>
          <div className="mb-10 flex justify-center">
            <Wordmark />
          </div>
          <h1 className="font-display text-5xl leading-[1.08] tracking-tight text-cream sm:text-6xl">
            Watch less.
            <br />
            <em className="italic text-signal">Know more.</em>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-cream-dim">
            Paste a YouTube link and get an AI summary with timestamped key
            moments, the full transcript, and a chat that answers from the video.
          </p>
        </div>

        <div className="rise mt-10 w-full" style={{ animationDelay: "120ms" }}>
          <UrlInput onSubmit={loadVideo} busy={loadingTranscript} />
          {inputError && (
            <p className="mt-3 rounded-lg border border-signal/30 bg-signal/5 px-4 py-2.5 text-center text-[13px] text-cream-dim">
              {inputError}
            </p>
          )}
        </div>

        <div
          className="rise mt-12 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted"
          style={{ animationDelay: "240ms" }}
        >
          <span>Transcript</span>
          <span className="text-signal">·</span>
          <span>Timestamped summary</span>
          <span className="text-signal">·</span>
          <span>Chat with the video</span>
        </div>
      </main>
    );
  }

  /* ---------------- Result view ---------------- */
  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <header className="sticky top-0 z-40 -mx-4 mb-6 flex items-center gap-4 border-b border-line bg-ink/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <button
          type="button"
          onClick={() => {
            summaryAbortRef.current?.abort();
            loadedIdRef.current = null;
            setVideo(null);
            setSummary("");
            setSummaryError(null);
            router.replace("/", { scroll: false });
          }}
          title="Start over"
        >
          <Wordmark />
        </button>
        <div className="ml-auto w-full max-w-md">
          <UrlInput onSubmit={loadVideo} busy={loadingTranscript} compact />
        </div>
      </header>

      {inputError && (
        <p className="mb-4 rounded-lg border border-signal/30 bg-signal/5 px-4 py-2.5 text-[13px] text-cream-dim">
          {inputError}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)]">
        {/* Left: player + transcript */}
        <div className="min-w-0">
          <div className="lg:sticky lg:top-[4.5rem]">
            <VideoPlayer ref={playerRef} videoId={video.videoId} />
            <div className="mt-4 border-b border-line pb-4">
              <h1 className="font-display text-2xl leading-snug text-cream">
                {video.title}
              </h1>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                {video.author} · {video.segments.length} caption lines
              </p>
            </div>
            <div className="mt-4">
              <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                Transcript
              </p>
              <TranscriptPanel segments={video.segments} onSeek={seek} />
            </div>
          </div>
        </div>

        {/* Right: summary / chat */}
        <div className="min-w-0">
          <div className="rounded-xl border border-line bg-surface/60 p-5">
            <div className="mb-4 flex gap-1 rounded-lg border border-line bg-ink p-1">
              {(["summary", "chat"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`flex-1 rounded-md px-3 py-1.5 font-mono text-[12px] uppercase tracking-[0.15em] transition-colors ${
                    tab === t
                      ? "bg-raised text-cream"
                      : "text-muted hover:text-cream-dim"
                  }`}
                >
                  {t === "summary" ? "Summary" : "Chat"}
                </button>
              ))}
            </div>

            {tab === "summary" ? (
              <SummaryPanel
                title={video.title}
                summary={summary}
                isStreaming={summaryStreaming}
                error={summaryError}
                onSeek={seek}
                onRegenerate={() => void runSummarize(video, transcriptText)}
              />
            ) : (
              <div className="h-[65dvh] min-h-[24rem]">
                <ChatPanel
                  title={video.title}
                  author={video.author}
                  transcript={transcriptText}
                  onSeek={seek}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { transcriptToText, type TranscriptSegment } from "@/lib/format";
import { parseSummary, readingMinutes } from "@/lib/summary-parser";
import Backdrop from "@/components/Backdrop";
import Logo from "@/components/Logo";
import CommandBar from "@/components/CommandBar";
import Hero from "@/components/Hero";
import FeaturedExamples from "@/components/FeaturedExamples";
import ProgressPanel from "@/components/ProgressPanel";
import VideoHeader from "@/components/VideoHeader";
import SummarySections from "@/components/SummarySections";
import AskAI from "@/components/AskAI";
import ExportBar from "@/components/ExportBar";
import TranscriptDrawer from "@/components/TranscriptDrawer";
import { type VideoPlayerHandle } from "@/components/VideoPlayer";

interface VideoData {
  videoId: string;
  title: string;
  author: string;
  thumbnail: string;
  segments: TranscriptSegment[];
  source: "direct" | "supadata";
}

const DEMO_VIDEO_ID = "UF8uR6Z6KLc"; // Steve Jobs' Stanford address

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [video, setVideo] = useState<VideoData | null>(null);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const [summaryRaw, setSummaryRaw] = useState("");
  const [summaryStreaming, setSummaryStreaming] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [streamOpened, setStreamOpened] = useState(false);
  const [chaptersDone, setChaptersDone] = useState(false);

  const playerRef = useRef<VideoPlayerHandle>(null);
  const summaryAbortRef = useRef<AbortController | null>(null);
  const loadedIdRef = useRef<string | null>(null);

  const parsed = useMemo(() => parseSummary(summaryRaw), [summaryRaw]);
  const transcriptText = useMemo(
    () => (video ? transcriptToText(video.segments) : ""),
    [video],
  );
  const readingMin = summaryRaw ? readingMinutes(summaryRaw) : null;

  // Small delay so "Detecting chapters" checks in visibly after "Retrieving
  // transcript" instead of both popping at once.
  useEffect(() => {
    if (!video) {
      setChaptersDone(false);
      return;
    }
    const t = setTimeout(() => setChaptersDone(true), 500);
    return () => clearTimeout(t);
  }, [video]);

  const runSummarize = useCallback(async (data: VideoData, text: string) => {
    summaryAbortRef.current?.abort();
    const controller = new AbortController();
    summaryAbortRef.current = controller;

    setSummaryRaw("");
    setSummaryError(null);
    setStreamOpened(false);
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
      setStreamOpened(true);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const current = acc;
        setSummaryRaw(current);
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
  }, []);

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
        router.replace(`/?v=${videoData.videoId}`, { scroll: false });
        window.scrollTo({ top: 0 });
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

  const reset = useCallback(() => {
    summaryAbortRef.current?.abort();
    loadedIdRef.current = null;
    setVideo(null);
    setSummaryRaw("");
    setSummaryError(null);
    setInputError(null);
    router.replace("/", { scroll: false });
    window.scrollTo({ top: 0 });
  }, [router]);

  const seek = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds);
    if (window.scrollY > 240) window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /* ---- Phase + progress stage ---- */
  const processing =
    loadingTranscript ||
    (video != null && summaryStreaming && !parsed.hasContent && !summaryError);

  let stage = 0;
  if (video) stage = 1;
  if (video && chaptersDone) stage = 2;
  if (streamOpened) stage = 3;
  if (summaryRaw.length > 40) stage = 4;
  if (parsed.tldr) stage = 5;
  if (parsed.hasContent && parsed.insights.length > 0) stage = 6;

  /* ================= Landing ================= */
  if (!video && !processing) {
    return (
      <>
        <Backdrop />
        <nav className="relative mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 py-6">
          <Logo />
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.22em] text-muted sm:block">
            Knowledge, compressed
          </span>
        </nav>
        <main className="relative">
          <Hero
            onSubmit={loadVideo}
            onWatchDemo={() => void loadVideo(DEMO_VIDEO_ID)}
            busy={loadingTranscript}
            error={inputError}
          />
          <FeaturedExamples onPick={(id) => void loadVideo(id)} busy={loadingTranscript} />
        </main>
        <footer className="relative border-t border-line">
          <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-3 px-6 py-10 sm:flex-row sm:justify-between">
            <Logo compact />
            <p className="text-[12.5px] text-muted">
              Stop consuming content. Start absorbing knowledge.
            </p>
          </div>
        </footer>
      </>
    );
  }

  /* ================= Processing ================= */
  if (processing) {
    return (
      <>
        <Backdrop />
        <nav className="relative mx-auto flex w-full max-w-[1200px] items-center px-6 py-6">
          <button type="button" onClick={reset} aria-label="Back to home">
            <Logo />
          </button>
        </nav>
        <main className="relative">
          <ProgressPanel stage={stage} videoTitle={video?.title ?? null} />
        </main>
      </>
    );
  }

  /* ================= Workspace ================= */
  return (
    <>
      <Backdrop />
      <header className="print-hide sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1200px] items-center gap-5 px-6 py-3.5">
          <button type="button" onClick={reset} aria-label="Back to home" className="shrink-0">
            <Logo compact />
          </button>
          <div className="ml-auto w-full max-w-[440px]">
            <CommandBar onSubmit={loadVideo} busy={loadingTranscript} compact />
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-[1200px] px-6 pb-28">
        {inputError && (
          <p role="alert" className="print-hide mt-5 rounded-xl border border-error/25 bg-error/[0.06] px-4 py-2.5 text-[13px] text-text2">
            {inputError}
          </p>
        )}

        <div className="fade-up pt-10">
          <VideoHeader
            ref={playerRef}
            videoId={video!.videoId}
            title={video!.title}
            author={video!.author}
            segments={video!.segments}
            readingMin={parsed.hasContent ? readingMin : null}
          />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <ExportBar title={video!.title} markdown={summaryRaw} videoId={video!.videoId} />
          <button
            type="button"
            onClick={() => void runSummarize(video!, transcriptText)}
            disabled={summaryStreaming}
            className="btn-ghost print-hide !gap-2 !rounded-xl !px-4 !py-2.5 text-[13px]"
            aria-label="Regenerate summary"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <path d="M21 3v6h-6" />
            </svg>
            Regenerate
          </button>
        </div>

        <div className="mx-auto mt-14 max-w-[860px]">
          {summaryError ? (
            <div className="card border-error/20 p-8 text-center">
              <p className="text-[16px] font-semibold text-text">
                Couldn&apos;t generate the summary
              </p>
              <p className="mt-2 text-[14px] text-text2">{summaryError}</p>
              <button
                type="button"
                onClick={() => void runSummarize(video!, transcriptText)}
                className="btn-primary mt-6 !px-6 !py-2.5 text-[14px]"
              >
                Try again
              </button>
            </div>
          ) : (
            <SummarySections parsed={parsed} streaming={summaryStreaming} onSeek={seek} />
          )}

          <div className="print-hide mt-16 space-y-12">
            <section>
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-white/[0.03] text-text2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </span>
                <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                  Ask AI
                </h2>
              </div>
              <AskAI
                title={video!.title}
                author={video!.author}
                transcript={transcriptText}
                onSeek={seek}
              />
            </section>

            <TranscriptDrawer segments={video!.segments} onSeek={seek} />
          </div>
        </div>
      </main>
    </>
  );
}

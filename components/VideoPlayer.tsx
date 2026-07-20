"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

// Minimal typing for the parts of the YouTube IFrame API we use.
interface YTPlayer {
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  cueVideoById(videoId: string): void;
  destroy(): void;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement,
        opts: {
          videoId: string;
          playerVars?: Record<string, number>;
          events?: { onReady?: () => void };
        },
      ) => YTPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;
function loadIframeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  apiPromise ??= new Promise<void>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });
  return apiPromise;
}

export interface VideoPlayerHandle {
  seekTo(seconds: number): void;
}

const VideoPlayer = forwardRef<VideoPlayerHandle, { videoId: string }>(
  function VideoPlayer({ videoId }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<YTPlayer | null>(null);

    useEffect(() => {
      let cancelled = false;
      loadIframeApi().then(() => {
        if (cancelled || !containerRef.current || !window.YT) return;
        if (playerRef.current) {
          playerRef.current.cueVideoById(videoId);
          return;
        }
        const mount = document.createElement("div");
        containerRef.current.appendChild(mount);
        playerRef.current = new window.YT.Player(mount, {
          videoId,
          playerVars: { rel: 0, modestbranding: 1 },
        });
      });
      return () => {
        cancelled = true;
      };
    }, [videoId]);

    useEffect(
      () => () => {
        playerRef.current?.destroy();
        playerRef.current = null;
      },
      [],
    );

    useImperativeHandle(ref, () => ({
      seekTo(seconds: number) {
        const player = playerRef.current;
        if (!player) return;
        player.seekTo(seconds, true);
        player.playVideo();
      },
    }));

    return (
      <div
        ref={containerRef}
        className="aspect-video w-full [&>iframe]:h-full [&>iframe]:w-full [&_iframe]:aspect-video [&_iframe]:w-full"
      />
    );
  },
);

export default VideoPlayer;

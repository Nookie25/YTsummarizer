# Reelnotes — YouTube Video Summarizer

Paste a YouTube link and get an AI summary with timestamped key moments, the full
transcript, and a chat that answers questions from the video. Clicking any
timestamp — in the transcript, the summary, or a chat answer — seeks the embedded
player to that moment.

Built with Next.js (App Router), Tailwind CSS, and either the Anthropic API
(Claude Opus 4.8, streamed, default) or the OpenAI API (`gpt-4o` by default) —
selectable via `AI_PROVIDER`.

## Features

- **Transcript** — fetched free via YouTube's own caption tracks (youtubei.js),
  with an optional [Supadata](https://supadata.ai) fallback for cloud hosts that
  YouTube blocks.
- **AI summary** — Overview → sectioned summary → Key Moments, streamed live,
  with clickable `[mm:ss]` timestamps.
- **Chat with the video** — answers come from the transcript (with prompt
  caching, so follow-up questions are fast and cheap) and cite timestamps.
- **Copy / export** — copy the summary or download it as `.md` / `.txt`.
- **Basic abuse protection** — per-IP rate limits and a transcript length cap.

## Setup

```bash
npm install
cp .env.example .env.local   # then paste your API key into it
npm run dev
```

`.env.local`:

| Variable | Required | Purpose |
|---|---|---|
| `AI_PROVIDER` | no | `anthropic` (default) or `openai` — picks which API powers the summary + chat |
| `ANTHROPIC_API_KEY` | if provider is `anthropic` | [Get a key](https://platform.claude.com/settings/keys) |
| `OPENAI_API_KEY` | if provider is `openai` | [Get a key](https://platform.openai.com/api-keys) |
| `OPENAI_MODEL` | no | Overrides the OpenAI model (default `gpt-4o`) |
| `SUPADATA_API_KEY` | no | Transcript fallback for cloud IPs YouTube blocks (needed on Vercel if direct fetching fails) |

Only the key for the *active* provider is required — you don't need both.

Open http://localhost:3000 and paste any YouTube link with captions.

## Deploying to Vercel

1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com/new), import the repo (defaults are fine).
3. Add your provider's key (`ANTHROPIC_API_KEY` or `OPENAI_API_KEY` + `AI_PROVIDER=openai`),
   and optionally `SUPADATA_API_KEY`, under **Settings → Environment Variables**,
   then deploy.

**Heads-up about transcripts in production:** YouTube frequently blocks caption
requests from datacenter IPs. If summaries work locally but transcript fetching
fails on Vercel, create a free Supadata key (~100 requests/month free) and set
`SUPADATA_API_KEY` — the app falls back to it automatically.

**Cost note:** the app calls the active provider's API with *your* key. The
built-in per-IP rate limits are best-effort (in-memory, per serverless
instance), so don't share the URL widely without adding a durable rate limiter
(e.g. Upstash) or an access gate.

## Project structure

```
app/
  page.tsx                  UI entry (hero → result view)
  api/transcript/route.ts   POST {url} → video metadata + transcript segments
  api/summarize/route.ts    POST → streamed markdown summary
  api/chat/route.ts         POST → streamed chat reply (prompt-cached transcript)
components/
  Home.tsx                  page orchestration and layout
  VideoPlayer.tsx           YouTube IFrame API wrapper (seekTo support)
  TranscriptPanel.tsx       clickable timestamped transcript
  SummaryPanel.tsx          streamed summary + copy/export
  ChatPanel.tsx             chat with the video
  Markdown.tsx              mini markdown renderer with clickable [mm:ss] chips
lib/
  youtube.ts                video ID parsing, oEmbed metadata, transcript providers
  ai.ts                     provider dispatcher (reads AI_PROVIDER, routes to one of the below)
  anthropic.ts              Claude-specific streaming implementation
  openai.ts                 OpenAI-specific streaming implementation
  ai-types.ts               shared request/response shapes for both providers
  prompts.ts                provider-agnostic system prompts + transcript truncation
  stream.ts                 shared "async producer → streamed Response" helper
  format.ts                 shared timestamp/transcript helpers
  rate-limit.ts             best-effort per-IP rate limiter
```

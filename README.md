# MemoTube — Understand Hours of Content in Minutes

Paste a YouTube link and get a structured knowledge summary — TL;DR, key insight
cards, an interactive timeline, action items, and notable quotes — plus the full
transcript and a chat that answers questions from the video. Clicking any
timestamp — in the timeline, quotes, transcript, or a chat answer — seeks the
embedded player to that moment.

Built with Next.js (App Router), Tailwind CSS, and either the Anthropic API
(Claude Opus 4.8, streamed, default) or the OpenAI API (`gpt-4o` by default) —
selectable via `AI_PROVIDER`.

## Features

- **Transcript** — fetched free via YouTube's own caption tracks (youtubei.js),
  with an optional [Supadata](https://supadata.ai) fallback for cloud hosts that
  YouTube blocks.
- **Structured AI summary** — TL;DR → Key Insights → Timeline → Action Items →
  Notable Quotes, streamed live and parsed into interactive sections with
  clickable `[mm:ss]` timestamps.
- **Chat with the video** — answers come from the transcript (with prompt
  caching, so follow-up questions are fast and cheap) and cite timestamps.
- **Copy / export** — copy, download as Markdown, print to PDF, copy for
  Notion, or share a deep link.
- **Abuse protection** — per-IP rate limits (durable via Upstash Redis when
  configured, in-memory fallback otherwise) and a transcript length cap.

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
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | no | Durable rate limiting via [Upstash](https://upstash.com) (recommended for production). Without these, rate limiting falls back to an in-memory limiter. |

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

**Cost note:** the app calls the active provider's API with *your* key. Add
`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (free tier at
[upstash.com](https://upstash.com)) before sharing the URL widely — without
them, rate limiting falls back to an in-memory limiter that resets on every
cold start and doesn't share state across serverless instances.

## Project structure

```
app/
  page.tsx                  UI entry (hero → result view)
  api/transcript/route.ts   POST {url} → video metadata + transcript segments
  api/summarize/route.ts    POST → streamed markdown summary
  api/chat/route.ts         POST → streamed chat reply (prompt-cached transcript)
components/
  Home.tsx                  state machine: landing → processing → workspace
  Hero.tsx / FloatingDashboard.tsx / FeaturedExamples.tsx   landing page
  ProgressPanel.tsx         animated processing checklist
  VideoHeader.tsx           player + title/duration/reading-time chips
  SummarySections.tsx       TL;DR, insights, timeline, action items, quotes
  AskAI.tsx                 chat with the video
  ExportBar.tsx             copy / markdown / PDF / Notion / share
  TranscriptDrawer.tsx      collapsible full transcript
  VideoPlayer.tsx           YouTube IFrame API wrapper (seekTo support)
  CommandBar.tsx / Inline.tsx / Logo.tsx / Backdrop.tsx     shared UI
lib/
  youtube.ts                video ID parsing, oEmbed metadata, transcript providers
  ai.ts                     provider dispatcher (reads AI_PROVIDER, routes to one of the below)
  summary-parser.ts         parses the streamed summary into typed sections
  anthropic.ts              Claude-specific streaming implementation
  openai.ts                 OpenAI-specific streaming implementation
  ai-types.ts               shared request/response shapes for both providers
  prompts.ts                provider-agnostic system prompts + transcript truncation
  stream.ts                 shared "async producer → streamed Response" helper
  format.ts                 shared timestamp/transcript helpers
  rate-limit.ts             per-IP rate limiter (Upstash Redis, in-memory fallback)
```

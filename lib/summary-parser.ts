// Progressively parses the streamed summary markdown (see SUMMARY_SYSTEM in
// lib/prompts.ts) into typed sections so each UI block can hydrate the moment
// its content starts arriving. Pure + client-safe. Tolerant of small model
// deviations: optional bold, any dash variant, h:mm:ss timestamps.

import { parseTimestamp } from "@/lib/format";

export interface Insight {
  label: string;
  text: string;
}

export interface TimelineEntry {
  time: string;
  seconds: number;
  title: string;
  text: string;
}

export interface Quote {
  text: string;
  time: string | null;
  seconds: number | null;
}

export interface ParsedSummary {
  tldr: string;
  insights: Insight[];
  timeline: TimelineEntry[];
  actions: string[];
  quotes: Quote[];
  /** true once any section content exists */
  hasContent: boolean;
  /** raw text of sections whose heading we didn't recognize */
  extra: string;
}

const EMPTY: ParsedSummary = {
  tldr: "",
  insights: [],
  timeline: [],
  actions: [],
  quotes: [],
  hasContent: false,
  extra: "",
};

type SectionKey = "tldr" | "insights" | "timeline" | "actions" | "quotes" | "extra";

function classifyHeading(heading: string): SectionKey {
  const h = heading.toLowerCase();
  if (h.includes("tl;dr") || h.includes("tldr") || h.includes("overview")) return "tldr";
  if (h.includes("insight")) return "insights";
  if (h.includes("timeline") || h.includes("moment") || h.includes("chapter")) return "timeline";
  if (h.includes("action")) return "actions";
  if (h.includes("quote")) return "quotes";
  return "extra";
}

const DASH = /\s+[—–-]\s+/; // em/en/hyphen with spaces
const TS = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]/;

function stripBold(text: string): string {
  return text.replace(/\*\*/g, "").trim();
}

function bulletLines(body: string): string[] {
  return body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^[-*] /.test(l))
    .map((l) => l.slice(2).trim())
    .filter(Boolean);
}

function parseInsights(body: string): Insight[] {
  return bulletLines(body).map((item) => {
    const parts = item.split(DASH);
    if (parts.length >= 2) {
      return {
        label: stripBold(parts[0]),
        text: parts.slice(1).join(" — ").trim(),
      };
    }
    return { label: "", text: stripBold(item) };
  });
}

function parseTimeline(body: string): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  for (const item of bulletLines(body)) {
    const tsMatch = item.match(TS);
    if (!tsMatch) continue;
    const seconds = parseTimestamp(tsMatch[1]);
    if (seconds == null) continue;
    const rest = item.replace(TS, "").trim();
    const parts = rest.split(DASH);
    entries.push({
      time: tsMatch[1],
      seconds,
      title: stripBold(parts[0] ?? ""),
      text: parts.slice(1).join(" — ").trim(),
    });
  }
  return entries;
}

function parseActions(body: string): string[] {
  return bulletLines(body)
    .map(stripBold)
    .filter((item) => item.toLowerCase() !== "none" && item.toLowerCase() !== "none.");
}

function parseQuotes(body: string): Quote[] {
  return bulletLines(body).map((item) => {
    const tsMatch = item.match(TS);
    const seconds = tsMatch ? parseTimestamp(tsMatch[1]) : null;
    let text = item.replace(TS, "");
    // strip trailing dash left behind after removing the timestamp
    text = text.replace(/\s+[—–-]\s*$/, "").trim();
    // strip surrounding quotation marks
    text = text.replace(/^["“”']+|["“”']+$/g, "").trim();
    return {
      text: stripBold(text),
      time: tsMatch?.[1] ?? null,
      seconds: seconds ?? null,
    };
  });
}

export function parseSummary(raw: string): ParsedSummary {
  if (!raw.trim()) return EMPTY;

  const result: ParsedSummary = { ...EMPTY, insights: [], timeline: [], actions: [], quotes: [] };
  // Split into (heading, body) chunks. Content before the first ## heading is
  // treated as TL;DR (models occasionally skip the first heading).
  const parts = raw.split(/^##\s+/m);
  const preamble = parts[0]?.trim();
  if (preamble) result.tldr = preamble;

  const extras: string[] = [];
  for (const part of parts.slice(1)) {
    const newline = part.indexOf("\n");
    const heading = (newline === -1 ? part : part.slice(0, newline)).trim();
    const body = newline === -1 ? "" : part.slice(newline + 1);
    switch (classifyHeading(heading)) {
      case "tldr":
        result.tldr = body.trim();
        break;
      case "insights":
        result.insights = parseInsights(body);
        break;
      case "timeline":
        result.timeline = parseTimeline(body);
        break;
      case "actions":
        result.actions = parseActions(body);
        break;
      case "quotes":
        result.quotes = parseQuotes(body);
        break;
      default:
        extras.push(`## ${heading}\n${body.trim()}`);
    }
  }

  result.extra = extras.join("\n\n");
  result.hasContent =
    Boolean(result.tldr) ||
    result.insights.length > 0 ||
    result.timeline.length > 0 ||
    result.actions.length > 0 ||
    result.quotes.length > 0;
  return result;
}

/** Words-per-minute estimate for the "reading time" stat. */
export function readingMinutes(raw: string): number {
  const words = raw.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

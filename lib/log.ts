// Structured JSON logging. On Vercel, stdout/stderr are captured verbatim and
// forwarded to whatever log drain you connect (Axiom, Better Stack, etc.), so
// emitting one JSON object per line makes every log queryable by field rather
// than grep-able as free text. Locally it's just readable JSON in the console.
//
// Error-level logs are also forwarded to Sentry (when a DSN is configured) so
// exceptions land in one place with a stack trace.

import * as Sentry from "@sentry/nextjs";

type Level = "info" | "warn" | "error";

// Arbitrary structured fields attached to a log line (request id, video id,
// status code, duration, etc.). Kept to JSON-serialisable values.
type Fields = Record<string, unknown>;

function emit(level: Level, msg: string, fields?: Fields) {
  const line = JSON.stringify({
    level,
    msg,
    time: new Date().toISOString(),
    ...fields,
  });
  // Route to the matching console method so Vercel tags severity correctly.
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  info(msg: string, fields?: Fields) {
    emit("info", msg, fields);
  },
  warn(msg: string, fields?: Fields) {
    emit("warn", msg, fields);
  },
  // `error` takes the caught value separately so we can serialise its message
  // for the log line and hand the real Error object to Sentry for the stack.
  error(msg: string, err?: unknown, fields?: Fields) {
    const errMessage = err instanceof Error ? err.message : err != null ? String(err) : undefined;
    emit("error", msg, { ...fields, error: errMessage });
    if (err !== undefined) {
      Sentry.captureException(err, { extra: { msg, ...fields } });
    }
  },
};

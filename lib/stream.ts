// Turns an async "write chunks" producer into a streamed plain-text Response,
// with a consistent fallback message if the underlying provider call fails
// mid-stream. Shared by every provider implementation.

export function createTextStream(
  produce: (write: (text: string) => void) => Promise<void>,
): Response {
  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        await produce((text) => controller.enqueue(encoder.encode(text)));
        controller.close();
      } catch (err) {
        console.error("stream error:", err);
        controller.enqueue(
          encoder.encode("\n\n> ⚠️ The response was interrupted. Please try again."),
        );
        controller.close();
      }
    },
  });
  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

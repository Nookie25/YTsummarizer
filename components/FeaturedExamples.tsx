"use client";

// Curated public, captioned videos so the product never feels empty — one
// click runs the real pipeline.

const FEATURED = [
  {
    id: "UF8uR6Z6KLc",
    title: "Steve Jobs' 2005 Stanford Commencement Address",
    channel: "Stanford",
    length: "15 min",
  },
  {
    id: "qp0HIF3SfI4",
    title: "How Great Leaders Inspire Action",
    channel: "TED · Simon Sinek",
    length: "18 min",
  },
  {
    id: "aircAruvnKk",
    title: "But What Is a Neural Network?",
    channel: "3Blue1Brown",
    length: "18 min",
  },
  {
    id: "arj7oStGLkU",
    title: "Inside the Mind of a Master Procrastinator",
    channel: "TED · Tim Urban",
    length: "14 min",
  },
];

export default function FeaturedExamples({
  onPick,
  busy,
}: {
  onPick: (videoId: string) => void;
  busy: boolean;
}) {
  return (
    <section className="mx-auto w-full max-w-[1200px] px-6 pb-28 pt-4">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-semibold tracking-tight text-text">
            Try it on a featured video
          </h2>
          <p className="mt-1.5 text-[14px] text-text2">
            One click — watch a full knowledge summary generate live.
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURED.map((video, i) => (
          <button
            key={video.id}
            type="button"
            disabled={busy}
            onClick={() => onPick(video.id)}
            className="card card-lift fade-up group overflow-hidden text-left disabled:opacity-50"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <div className="relative aspect-video w-full overflow-hidden bg-bg2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover opacity-80 transition-all duration-300 group-hover:scale-[1.04] group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg/80 via-transparent to-transparent" />
              <span className="absolute bottom-2.5 right-2.5 rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-text backdrop-blur">
                {video.length}
              </span>
            </div>
            <div className="p-4">
              <p className="line-clamp-2 text-[14px] font-medium leading-snug text-text">
                {video.title}
              </p>
              <p className="mt-1.5 text-[12px] text-muted">{video.channel}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

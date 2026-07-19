import type { Metadata } from "next";
import { Instrument_Serif, Spline_Sans, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
});

const splineSans = Spline_Sans({
  subsets: ["latin"],
  variable: "--font-spline-sans",
});

const splineMono = Spline_Sans_Mono({
  subsets: ["latin"],
  variable: "--font-spline-mono",
});

export const metadata: Metadata = {
  title: "Reelnotes — YouTube Video Summarizer",
  description:
    "Paste a YouTube link and get an AI summary with timestamped key moments, the full transcript, and a chat that answers from the video.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${splineSans.variable} ${splineMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}

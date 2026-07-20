import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "MemoTube — Understand Hours of Content in Minutes",
  description:
    "Extract key insights, action items, timestamps, and important ideas from any YouTube video with AI-powered precision. Stop consuming content. Start absorbing knowledge.",
  openGraph: {
    title: "MemoTube — Understand Hours of Content in Minutes",
    description:
      "Extract key insights, action items, timestamps, and important ideas from any YouTube video with AI-powered precision.",
    type: "website",
    siteName: "MemoTube",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}

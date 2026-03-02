import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Who Knows Better?",
  description: "1v1 trivia duels. Pick a topic. Share a code. Settle it.",
  openGraph: {
    title: "Think you know better? I dare you.",
    description: "1v1 trivia duels. Pick a topic. Share a code. Settle it.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${jetbrainsMono.variable} antialiased bg-bg text-text min-h-screen bg-grid`}
      >
        {children}
      </body>
    </html>
  );
}

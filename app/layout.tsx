import type { Metadata } from "next";
import { Happy_Monkey, Geist_Mono } from "next/font/google";
import "./globals.css";

const happyMonkey = Happy_Monkey({
  variable: "--font-happy-monkey",
  weight: "400",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RogueAgent — AI Job Application Assistant",
  description:
    "Paste a job posting URL, upload your resume, and let RogueAgent research the company, write a tailored cover letter, and prep your interview questions.",
  openGraph: {
    title: "RogueAgent — AI Job Application Assistant",
    description:
      "AI agent that researches companies, writes tailored cover letters, and generates interview prep questions from any job posting.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "RogueAgent — AI Job Application Assistant",
    description:
      "AI agent that researches companies, writes tailored cover letters, and generates interview prep questions from any job posting.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${happyMonkey.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

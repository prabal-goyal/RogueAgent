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
  title: "Job Application Assistant",
  description: "Agent that researches a company and drafts a tailored cover letter",
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

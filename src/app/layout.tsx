import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SF Editor - Academic Writing Platform",
  description: "Educational writing platform with keystroke logging and AI detection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Navigation */}
        <nav
          style={{
            display: "flex",
            gap: "20px",
            padding: "12px 24px",
            borderBottom: "1px solid #e5e5e5",
            background: "#fafafa",
            alignItems: "center",
          }}
        >
          <a
            href="/"
            style={{
              fontWeight: "bold",
              fontSize: "18px",
              textDecoration: "none",
              color: "#111",
            }}
          >
            SF Editor
          </a>
          <a
            href="/editor"
            style={{
              textDecoration: "none",
              color: "#555",
              fontSize: "14px",
            }}
          >
            Editor
          </a>
          <a
            href="/viewer"
            style={{
              textDecoration: "none",
              color: "#555",
              fontSize: "14px",
            }}
          >
            Viewer
          </a>
        </nav>

        {children}
      </body>
    </html>
  );
}

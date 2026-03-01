import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { NavAuth } from "@/components/nav-auth";

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
        <AuthProvider>
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
            href="/student"
            style={{
              textDecoration: "none",
              color: "#555",
              fontSize: "14px",
            }}
          >
            Student
          </a>
          <a
            href="/teacher"
            style={{
              textDecoration: "none",
              color: "#555",
              fontSize: "14px",
            }}
          >
            Teacher
          </a>
          <NavAuth />
        </nav>

        {children}
        </AuthProvider>
      </body>
    </html>
  );
}

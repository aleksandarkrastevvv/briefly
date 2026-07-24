import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Briefly",
  description:
    "Briefly is a mobile-first daily briefing app for important public information.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bg">
      <body>{children}</body>
    </html>
  );
}

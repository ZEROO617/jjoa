import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Library — 3D Portfolio",
  description:
    "오래된 도서관을 직접 걸어 다니며 프로젝트를 발견하는 인터랙티브 3D 포트폴리오.",
};

export const viewport: Viewport = {
  themeColor: "#0d0a08",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

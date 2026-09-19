import type { Metadata, Viewport } from "next";
import { OWNER } from "@/data/projects";
import "./globals.css";

export const metadata: Metadata = {
  title: `${OWNER.name} — 포트폴리오`,
  description: `${OWNER.name}의 포트폴리오. 문을 열고 들어가 서랍 속 자료를 꺼내 봅니다.`,
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

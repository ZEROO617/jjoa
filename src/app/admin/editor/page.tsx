"use client";

import dynamic from "next/dynamic";

// WebGL 에디터는 클라이언트 전용이다.
const BookEditor = dynamic(
  () => import("@/components/admin/BookEditor").then((m) => m.BookEditor),
  { ssr: false, loading: () => <p className="muted">Loading editor...</p> },
);

export default function EditorPage() {
  return <BookEditor />;
}

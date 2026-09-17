"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { EditProjectClient } from "@/components/admin/EditProjectClient";

/**
 * 프로젝트 수정 화면.
 *
 * RPD 36장은 /admin/projects/[id] 경로를 제시하지만, 정적 내보내기
 * (GitHub Pages)에서는 빌드 시점에 알 수 없는 id를 미리 생성할 수 없다.
 * 그래서 쿼리 파라미터(/admin/projects/edit?id=...)로 바꿨다.
 */
function EditProjectPageInner() {
  const id = useSearchParams().get("id");

  if (!id) return <div className="alert">수정할 프로젝트 id가 없습니다.</div>;
  return <EditProjectClient id={id} />;
}

export default function EditProjectPage() {
  // useSearchParams는 정적 렌더 시 Suspense 경계를 요구한다.
  return (
    <Suspense fallback={<p className="muted">Loading...</p>}>
      <EditProjectPageInner />
    </Suspense>
  );
}

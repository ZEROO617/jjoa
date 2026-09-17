"use client";

import { useGameStore } from "@/store/useGameStore";

/** RPD 32장 — 과한 연출 없이 [E] OPEN 정도의 피드백만 제공한다. */
export function InteractionPrompt({ touchMode }: { touchMode: boolean }) {
  const mode = useGameStore((s) => s.interactionMode);
  const focus = useGameStore((s) => s.focus);
  const indexOpen = useGameStore((s) => s.indexOpen);

  const visible = mode === "explore" && !indexOpen && focus?.kind === "book";

  return (
    <div className="prompt" data-visible={visible} aria-hidden={!visible}>
      {touchMode ? (
        <span>TAP TO OPEN</span>
      ) : (
        <>
          <span className="key">E</span>
          <span>OPEN</span>
        </>
      )}
    </div>
  );
}

"use client";

import { useGameStore } from "@/store/useGameStore";
import type { AboutProfile } from "@/types/project";

/** RPD 8장 — 동상 근처에서 About Me 표시. 내용은 DB에서 온다. */
export function AboutPanel({ about }: { about: AboutProfile }) {
  const aboutOpen = useGameStore((s) => s.aboutOpen);
  const mode = useGameStore((s) => s.interactionMode);
  const indexOpen = useGameStore((s) => s.indexOpen);

  const visible = aboutOpen && mode === "explore" && !indexOpen;

  return (
    <div className="about" data-visible={visible} aria-hidden={!visible}>
      <h2>{about.name}</h2>
      <div className="role">
        {about.title}
        {about.affiliation ? ` · ${about.affiliation}` : ""}
      </div>
      <p className="tagline">{about.tagline}</p>
      {about.links.length > 0 && (
        <div className="links">
          {about.links.map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

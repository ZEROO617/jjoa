"use client";

import { useState } from "react";
import { CabinetScene } from "@/components/CabinetScene";
import { DoorScene } from "@/components/DoorScene";
import { OWNER, PROJECTS } from "@/data/projects";

/** 문 → 서랍장, 두 장면을 오가는 최상위 컴포넌트. */
export function Portfolio() {
  const [entered, setEntered] = useState(false);

  if (!entered) {
    return <DoorScene name={OWNER.name} role={OWNER.role} onEnter={() => setEntered(true)} />;
  }

  return <CabinetScene ownerName={OWNER.name} projects={PROJECTS} />;
}

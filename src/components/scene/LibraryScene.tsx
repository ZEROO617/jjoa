"use client";

import { AdaptiveDpr, Preload } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import { ACESFilmicToneMapping } from "three";
import { useIsTouchDevice } from "@/hooks/useIsTouchDevice";
import { useGameStore } from "@/store/useGameStore";
import { Books } from "./Books";
import { Dust } from "./Dust";
import { Library } from "./Library";
import { Lighting } from "./Lighting";
import { Player } from "./Player";
import { Statue } from "./Statue";
import { PLAYER } from "./layout";
import { TouchPicking } from "./TouchPicking";
import type { AboutProfile, Project } from "@/types/project";

interface LibrarySceneProps {
  projects: Project[];
  about: AboutProfile;
}

/** Suspense가 풀리는 시점(에셋 로드 완료)을 스토어에 알린다. */
function ReadySignal() {
  useEffect(() => {
    const id = requestAnimationFrame(() => useGameStore.getState().setSceneReady(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return null;
}

export function LibraryScene({ projects, about }: LibrarySceneProps) {
  const touchMode = useIsTouchDevice();

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ fov: 72, near: 0.05, far: 60, position: [PLAYER.start.x, PLAYER.eyeHeight, PLAYER.start.z] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        scene.matrixWorldAutoUpdate = true;
      }}
    >
      {/* 따뜻한 실내 분위기를 위한 약한 안개 */}
      <fog attach="fog" args={["#1a120c", 14, 48]} />
      <color attach="background" args={["#0d0a08"]} />

      <Suspense fallback={null}>
        <Lighting />
        <Library projects={projects} />
        <Statue about={about} />
        <Books projects={projects} />
        <Dust />
        <Preload all />
      </Suspense>

      {/* 에셋 Suspense 밖에 두어, 텍스트/폰트 로딩이 준비 신호를 막지 못하게 한다. */}
      <ReadySignal />

      <Player projects={projects} touchMode={touchMode} />
      {touchMode && <TouchPicking />}
      <AdaptiveDpr pixelated />
    </Canvas>
  );
}

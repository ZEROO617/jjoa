"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/useGameStore";

/**
 * RPD 31장 — 몰입감을 위한 매우 약한 앰비언트 사운드.
 *
 * 설계 노트: 오디오 파일을 저장소에 넣지 않기 위해 Web Audio로 합성한다.
 * - 바탕: 저역 통과된 브라운 노이즈(장작/바람에 가까운 질감)
 * - 이벤트: 책을 꺼내고 펼칠 때의 짧은 종이 마찰음
 * 자동재생 정책 때문에 AudioContext는 사용자가 소리를 켠 뒤에만 생성한다.
 */
export function useAmbientAudio() {
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const ctxRef = useRef<AudioContext | null>(null);
  const bedGainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (!soundEnabled) {
      // 끄면 컨텍스트를 정리한다.
      bedGainRef.current?.gain.setTargetAtTime(0, ctxRef.current?.currentTime ?? 0, 0.3);
      const ctx = ctxRef.current;
      if (ctx) {
        const timer = window.setTimeout(() => void ctx.close().catch(() => undefined), 600);
        ctxRef.current = null;
        bedGainRef.current = null;
        return () => window.clearTimeout(timer);
      }
      return;
    }

    const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;

    const ctx = new AudioCtor();
    ctxRef.current = ctx;

    // 브라운 노이즈 버퍼(2초 루프)
    const length = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;

    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(0.055, ctx.currentTime, 1.2);
    bedGainRef.current = gain;

    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();

    return () => {
      try {
        source.stop();
      } catch {
        /* 이미 정지됨 */
      }
    };
  }, [soundEnabled]);

  // 책 상태 변화에 맞춘 짧은 효과음
  useEffect(() => {
    return useGameStore.subscribe((state, prev) => {
      if (state.bookPhase === prev.bookPhase) return;
      const ctx = ctxRef.current;
      if (!ctx) return;
      if (state.bookPhase === "PULLING") playRustle(ctx, 0.5);
      else if (state.bookPhase === "OPENING") playRustle(ctx, 0.35);
      else if (state.bookPhase === "CLOSING") playRustle(ctx, 0.45);
    });
  }, []);
}

/** 종이가 스치는 듯한 짧은 노이즈 버스트 */
function playRustle(ctx: AudioContext, amount: number) {
  const duration = 0.26;
  const length = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const envelope = (1 - i / length) ** 2.4;
    data[i] = (Math.random() * 2 - 1) * envelope;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 2400;
  filter.Q.value = 0.7;

  const gain = ctx.createGain();
  gain.gain.value = 0.12 * amount;

  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start();
  source.stop(ctx.currentTime + duration);
}

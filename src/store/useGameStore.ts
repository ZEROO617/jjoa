"use client";

import { create } from "zustand";

/** RPD 26장 — 책 애니메이션 상태 머신 */
export type BookPhase =
  | "IDLE"
  | "HOVERED"
  | "SELECTED"
  | "PULLING"
  | "OPENING"
  | "OPEN"
  | "CLOSING"
  | "RETURNING";

/** RPD 38장 — 3D 인터랙션 상태는 전역으로, DB 데이터와는 분리해서 관리한다. */
export type InteractionMode = "explore" | "book-opening" | "book-open" | "book-closing";

export type FocusTarget =
  | { kind: "book"; id: string }
  | { kind: "statue" }
  | null;

interface GameState {
  selectedProject: string | null;
  interactionMode: InteractionMode;
  pointerLocked: boolean;

  /** 크로스헤어가 겨누고 있는 대상 */
  focus: FocusTarget;
  bookPhase: BookPhase;

  sceneReady: boolean;
  hintVisible: boolean;
  indexOpen: boolean;
  aboutOpen: boolean;
  soundEnabled: boolean;

  /** 프로젝트 인덱스(TAB)에서 선택한 책으로 순간이동 요청 */
  travelRequest: string | null;

  setPointerLocked: (locked: boolean) => void;
  setFocus: (focus: FocusTarget) => void;
  setBookPhase: (phase: BookPhase) => void;
  setSceneReady: (ready: boolean) => void;
  dismissHint: () => void;
  toggleIndex: (open?: boolean) => void;
  setAboutOpen: (open: boolean) => void;
  toggleSound: (enabled?: boolean) => void;

  openBook: (id: string) => void;
  /** 책이 카메라 앞에 펼쳐져 UI가 뜬 시점 */
  bookOpened: () => void;
  closeBook: () => void;
  /** 책이 책장으로 완전히 복귀한 시점 */
  bookReturned: () => void;

  requestTravel: (id: string) => void;
  clearTravel: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  selectedProject: null,
  interactionMode: "explore",
  pointerLocked: false,
  focus: null,
  bookPhase: "IDLE",
  sceneReady: false,
  hintVisible: true,
  indexOpen: false,
  aboutOpen: false,
  soundEnabled: false,
  travelRequest: null,

  setPointerLocked: (pointerLocked) => set({ pointerLocked }),
  setFocus: (focus) => {
    // 책을 열고 있는 중에는 포커스를 갱신하지 않는다.
    if (get().interactionMode !== "explore") return;
    set({ focus });
  },
  setBookPhase: (bookPhase) => set({ bookPhase }),
  setSceneReady: (sceneReady) => set({ sceneReady }),
  dismissHint: () => set({ hintVisible: false }),
  toggleIndex: (open) => set((s) => ({ indexOpen: open ?? !s.indexOpen })),
  setAboutOpen: (aboutOpen) => set({ aboutOpen }),
  toggleSound: (enabled) => set((s) => ({ soundEnabled: enabled ?? !s.soundEnabled })),

  openBook: (id) => {
    if (get().interactionMode !== "explore") return;
    set({
      selectedProject: id,
      interactionMode: "book-opening",
      bookPhase: "PULLING",
      indexOpen: false,
      focus: null,
    });
  },

  bookOpened: () => {
    if (get().interactionMode !== "book-opening") return;
    set({ interactionMode: "book-open", bookPhase: "OPEN" });
  },

  closeBook: () => {
    const { interactionMode } = get();
    if (interactionMode !== "book-open" && interactionMode !== "book-opening") return;
    set({ interactionMode: "book-closing", bookPhase: "CLOSING" });
  },

  bookReturned: () => {
    if (get().interactionMode !== "book-closing") return;
    set({ selectedProject: null, interactionMode: "explore", bookPhase: "IDLE" });
  },

  requestTravel: (id) => set({ travelRequest: id, indexOpen: false }),
  clearTravel: () => set({ travelRequest: null }),
}));

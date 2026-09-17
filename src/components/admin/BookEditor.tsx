"use client";

import { Grid, OrbitControls, TransformControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Group, Object3D } from "three";
import { Library } from "@/components/scene/Library";
import { BOOK, ROOM } from "@/components/scene/layout";
import { listProjects, updateTransform } from "@/lib/data/admin";
import type { Project, Vec3 } from "@/types/project";

type Mode = "translate" | "rotate" | "scale";

interface Draft {
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
}

/**
 * RPD 20·43장 — Unity Editor처럼 책을 직접 끌어 배치하고 Transform 값을 DB에 저장한다.
 */
export function BookEditor() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("translate");
  const [status, setStatus] = useState<{ kind: "info" | "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const selectedRef = useRef<Group | null>(null);
  const [selectedObject, setSelectedObject] = useState<Object3D | null>(null);

  useEffect(() => {
    listProjects()
      .then((list) => {
        setProjects(list);
        setDrafts(
          Object.fromEntries(
            list.map((p) => [
              p.id,
              { position: { ...p.position }, rotation: { ...p.rotation }, scale: { ...p.scale } },
            ]),
          ),
        );
        if (list.length === 0) {
          setStatus({ kind: "info", text: "등록된 프로젝트가 없습니다. 먼저 프로젝트를 추가하세요." });
        }
      })
      .catch((e) => setStatus({ kind: "error", text: e instanceof Error ? e.message : String(e) }));
  }, []);

  const selected = projects.find((p) => p.id === selectedId) ?? null;
  const draft = selectedId ? drafts[selectedId] : undefined;

  /** TransformControls 드래그 결과를 폼 값으로 동기화 */
  const syncFromObject = useCallback(() => {
    const object = selectedRef.current;
    if (!object || !selectedId) return;
    setDrafts((prev) => ({
      ...prev,
      [selectedId]: {
        position: { x: object.position.x, y: object.position.y, z: object.position.z },
        rotation: { x: object.rotation.x, y: object.rotation.y, z: object.rotation.z },
        scale: { x: object.scale.x, y: object.scale.y, z: object.scale.z },
      },
    }));
  }, [selectedId]);

  /** 숫자 입력 → 3D 오브젝트 반영 */
  const editValue = (key: keyof Draft, axis: "x" | "y" | "z", value: number) => {
    if (!selectedId) return;
    setDrafts((prev) => {
      const current = prev[selectedId];
      if (!current) return prev;
      return { ...prev, [selectedId]: { ...current, [key]: { ...current[key], [axis]: value } } };
    });
  };

  const save = async () => {
    if (!selectedId || !draft) return;
    setBusy(true);
    try {
      await updateTransform(selectedId, draft);
      setProjects((prev) =>
        prev.map((p) => (p.id === selectedId ? { ...p, ...draft } : p)),
      );
      setStatus({ kind: "success", text: "저장되었습니다. 포트폴리오를 새로고침하면 반영됩니다." });
    } catch (e) {
      setStatus({ kind: "error", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    if (!selectedId || !selected) return;
    setDrafts((prev) => ({
      ...prev,
      [selectedId]: {
        position: { ...selected.position },
        rotation: { ...selected.rotation },
        scale: { ...selected.scale },
      },
    }));
  };

  return (
    <section>
      <h2>Book Editor</h2>
      {status && <div className={`alert ${status.kind === "error" ? "" : status.kind}`}>{status.text}</div>}

      <div className="editor-layout">
        <div className="editor-canvas">
          <Canvas
            camera={{ position: [0, 16, 15], fov: 45, near: 0.1, far: 120 }}
            dpr={[1, 1.5]}
            gl={{ antialias: true }}
          >
            <color attach="background" args={["#0b0806"]} />
            <ambientLight intensity={0.9} />
            <directionalLight position={[8, 14, 6]} intensity={1.4} />
            <hemisphereLight intensity={0.5} color="#bcd0e8" groundColor="#3a2a1c" />

            <Library />
            <Grid
              args={[ROOM.width, ROOM.depth]}
              cellSize={1}
              cellColor="#3a2e22"
              sectionSize={5}
              sectionColor="#6b5334"
              position={[0, 0.02, 0]}
              fadeDistance={45}
              infiniteGrid={false}
            />

            {projects.map((project) => {
              const d = drafts[project.id] ?? project;
              const isSelected = project.id === selectedId;
              return (
                <group
                  key={project.id}
                  ref={isSelected ? (selectedRef as React.Ref<Group>) : undefined}
                  position={[d.position.x, d.position.y, d.position.z]}
                  rotation={[d.rotation.x, d.rotation.y, d.rotation.z]}
                  scale={[d.scale.x, d.scale.y, d.scale.z]}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(project.id);
                  }}
                >
                  <mesh>
                    <boxGeometry args={[BOOK.thickness, BOOK.height, BOOK.depth]} />
                    <meshStandardMaterial
                      color={project.bookColor}
                      emissive={isSelected ? "#ffb04a" : "#000000"}
                      emissiveIntensity={isSelected ? 0.6 : 0}
                      roughness={0.7}
                    />
                  </mesh>
                  {/* 책등 방향 표시 — 통로를 향해야 한다 */}
                  <mesh position={[0, 0, BOOK.depth / 2 + 0.006]}>
                    <boxGeometry args={[BOOK.thickness * 0.98, BOOK.height * 0.98, 0.012]} />
                    <meshStandardMaterial color="#e8d9b5" roughness={0.9} />
                  </mesh>
                </group>
              );
            })}

            {selectedObject && (
              <TransformControls
                object={selectedObject}
                mode={mode}
                translationSnap={0.01}
                rotationSnap={Math.PI / 36}
                onObjectChange={syncFromObject}
              />
            )}

            <OrbitControls makeDefault target={[0, 1.5, 0]} maxPolarAngle={Math.PI / 2.05} />
            {/* 선택된 오브젝트의 ref가 준비된 뒤 TransformControls에 연결한다. */}
            <SelectionBridge selectedId={selectedId} groupRef={selectedRef} onResolve={setSelectedObject} />
          </Canvas>
        </div>

        <aside className="editor-panel">
          <div className="muted" style={{ marginBottom: 12 }}>
            책을 클릭해 선택하고, 기즈모로 옮긴 뒤 Save 하세요.
          </div>

          <ul className="editor-books">
            {projects.map((project) => (
              <li key={project.id}>
                <button
                  type="button"
                  data-selected={project.id === selectedId}
                  onClick={() => setSelectedId(project.id)}
                >
                  <span className="swatch" style={{ background: project.bookColor, width: 10, height: 14 }} />
                  {project.name}
                </button>
              </li>
            ))}
          </ul>

          {selected && draft ? (
            <>
              <div className="mode-switch">
                {(["translate", "rotate", "scale"] as const).map((m) => (
                  <button key={m} type="button" data-active={mode === m} onClick={() => setMode(m)}>
                    {m === "translate" ? "Move" : m}
                  </button>
                ))}
              </div>

              <NumberVector label="Position" step={0.01} value={draft.position} onChange={(a, v) => editValue("position", a, v)} />
              <NumberVector
                label="Rotation (deg)"
                step={5}
                value={{
                  x: Number(((draft.rotation.x * 180) / Math.PI).toFixed(2)),
                  y: Number(((draft.rotation.y * 180) / Math.PI).toFixed(2)),
                  z: Number(((draft.rotation.z * 180) / Math.PI).toFixed(2)),
                }}
                onChange={(a, v) => editValue("rotation", a, (v * Math.PI) / 180)}
              />
              <NumberVector label="Scale" step={0.05} value={draft.scale} onChange={(a, v) => editValue("scale", a, v)} />

              <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                <button className="btn primary" type="button" onClick={() => void save()} disabled={busy}>
                  {busy ? "..." : "Save"}
                </button>
                <button className="btn" type="button" onClick={reset} disabled={busy}>
                  Reset
                </button>
              </div>
            </>
          ) : (
            <p className="muted">선택된 책이 없습니다.</p>
          )}
        </aside>
      </div>
    </section>
  );
}

/**
 * ref는 렌더 사이클 밖에서 채워지므로, TransformControls가 붙을 수 있도록
 * 선택이 바뀐 다음 프레임에 object를 상태로 끌어올린다.
 */
function SelectionBridge({
  selectedId,
  groupRef,
  onResolve,
}: {
  selectedId: string | null;
  groupRef: React.RefObject<Group | null>;
  onResolve: (object: Object3D | null) => void;
}) {
  useEffect(() => {
    if (!selectedId) {
      onResolve(null);
      return;
    }
    const raf = requestAnimationFrame(() => onResolve(groupRef.current ?? null));
    return () => cancelAnimationFrame(raf);
  }, [selectedId, groupRef, onResolve]);

  return null;
}

function NumberVector({
  label,
  value,
  step,
  onChange,
}: {
  label: string;
  value: Vec3;
  step: number;
  onChange: (axis: "x" | "y" | "z", value: number) => void;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="grid-3">
        {(["x", "y", "z"] as const).map((axis) => (
          <input
            key={axis}
            type="number"
            step={step}
            aria-label={`${label} ${axis.toUpperCase()}`}
            value={Number(value[axis].toFixed(3))}
            onChange={(e) => onChange(axis, Number(e.target.value) || 0)}
          />
        ))}
      </div>
    </div>
  );
}

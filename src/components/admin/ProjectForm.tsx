"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { shelfSlots } from "@/components/scene/layout";
import { createProject, updateProject, uploadCoverImage } from "@/lib/data/admin";
import type { Project, ProjectInput } from "@/types/project";

const DEFAULTS: ProjectInput = {
  name: "",
  bookTitle: "",
  description: "",
  startDate: "",
  endDate: "",
  projectUrl: "",
  githubUrl: "",
  imageUrl: "",
  bookColor: "#4a2f1c",
  position: { x: 0, y: 1.34, z: -9.62 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
};

const PRESET_COLORS = [
  { label: "Dark Brown", value: "#4a2f1c" },
  { label: "Dark Green", value: "#1f3b2c" },
  { label: "Navy", value: "#1c2a45" },
  { label: "Burgundy", value: "#5c1f2b" },
  { label: "Plum", value: "#3a2b4a" },
  { label: "Charcoal", value: "#2c2c30" },
];

const toDeg = (rad: number) => Number(((rad * 180) / Math.PI).toFixed(2));
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** RPD 19장 — 프로젝트 추가/수정 폼. */
export function ProjectForm({ project }: { project?: Project }) {
  const router = useRouter();
  const slots = useMemo(() => shelfSlots(), []);

  const [form, setForm] = useState<ProjectInput>(() =>
    project
      ? {
          name: project.name,
          bookTitle: project.bookTitle,
          description: project.description,
          startDate: project.startDate,
          endDate: project.endDate ?? "",
          projectUrl: project.projectUrl ?? "",
          githubUrl: project.githubUrl ?? "",
          imageUrl: project.imageUrl ?? "",
          bookColor: project.bookColor,
          position: { ...project.position },
          rotation: { ...project.rotation },
          scale: { ...project.scale },
        }
      : DEFAULTS,
  );
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setVec = (key: "position" | "rotation" | "scale", axis: "x" | "y" | "z", value: number) =>
    setForm((prev) => ({ ...prev, [key]: { ...prev[key], [axis]: value } }));

  const applySlot = (index: string) => {
    const slot = slots[Number(index)];
    if (!slot) return;
    setForm((prev) => ({
      ...prev,
      position: { ...slot.position },
      rotation: { ...prev.rotation, y: slot.rotationY },
    }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      // 이미지 업로드는 프로젝트 id가 필요하므로 저장 후에 수행한다.
      const saved = project
        ? await updateProject(project.id, form)
        : await createProject(form);

      if (file) {
        const imageUrl = await uploadCoverImage(saved.id, file);
        await updateProject(saved.id, { ...form, imageUrl });
      }

      router.push("/admin");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <h2>{project ? "Edit Project" : "New Project"}</h2>
      {error && <div className="alert">{error}</div>}

      <div className="grid-2">
        <div className="field">
          <label htmlFor="name">Project Name</label>
          <input
            id="name"
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="LogisFinder"
          />
        </div>

        <div className="field">
          <label htmlFor="bookTitle">Book Title (책등)</label>
          <input
            id="bookTitle"
            required
            value={form.bookTitle}
            onChange={(e) => set("bookTitle", e.target.value)}
            placeholder="LOGIS\nFINDER"
          />
          <span className="help">
            {String.raw`\n`} 으로 줄바꿈. 실제 프로젝트 이름과 달라도 됩니다.
          </span>
        </div>
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="startDate">Start Date</label>
          <input
            id="startDate"
            required
            value={form.startDate}
            onChange={(e) => set("startDate", e.target.value)}
            placeholder="2025-03"
          />
        </div>
        <div className="field">
          <label htmlFor="endDate">End Date</label>
          <input
            id="endDate"
            value={form.endDate}
            onChange={(e) => set("endDate", e.target.value)}
            placeholder="2025-07 (비우면 진행 중)"
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="펼친 책 오른쪽 페이지에 표시될 프로젝트 개요"
        />
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="projectUrl">Project URL</label>
          <input
            id="projectUrl"
            type="url"
            value={form.projectUrl}
            onChange={(e) => set("projectUrl", e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div className="field">
          <label htmlFor="githubUrl">GitHub URL</label>
          <input
            id="githubUrl"
            type="url"
            value={form.githubUrl}
            onChange={(e) => set("githubUrl", e.target.value)}
            placeholder="https://github.com/..."
          />
        </div>
      </div>

      <h2>Cover Image</h2>
      <div className="grid-2">
        <div className="field">
          <label htmlFor="cover">Upload</label>
          <input
            id="cover"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <span className="help">업로드 시 WebP(장변 1600px)로 변환해 Storage에 저장합니다.</span>
        </div>
        <div className="field">
          <label htmlFor="imageUrl">Image URL</label>
          <input
            id="imageUrl"
            value={form.imageUrl}
            onChange={(e) => set("imageUrl", e.target.value)}
            placeholder="직접 URL을 입력할 수도 있습니다"
          />
        </div>
      </div>

      <h2>Book</h2>
      <div className="grid-2">
        <div className="field">
          <label htmlFor="bookColor">Book Color</label>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              id="bookColor"
              type="color"
              value={form.bookColor}
              onChange={(e) => set("bookColor", e.target.value)}
              style={{ width: 54, height: 42, padding: 3 }}
            />
            <select
              value=""
              onChange={(e) => e.target.value && set("bookColor", e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="">프리셋 선택...</option>
              {PRESET_COLORS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label} ({c.value})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="slot">책장 칸에서 위치 고르기</label>
          <select id="slot" defaultValue="" onChange={(e) => applySlot(e.target.value)}>
            <option value="">직접 입력</option>
            {slots.map((slot, i) => (
              <option key={slot.label} value={i}>
                {slot.label}
              </option>
            ))}
          </select>
          <span className="help">
            선택하면 아래 Position/Rotation Y가 해당 칸 좌표로 채워집니다. 세밀한 조정은{" "}
            <a href="/admin/editor">3D Book Editor</a>에서.
          </span>
        </div>
      </div>

      <VectorField
        label="Position"
        value={form.position}
        step={0.05}
        onChange={(axis, v) => setVec("position", axis, v)}
      />

      <div className="field">
        <label>Rotation (deg)</label>
        <div className="grid-3">
          {(["x", "y", "z"] as const).map((axis) => (
            <input
              key={axis}
              type="number"
              step={5}
              aria-label={`Rotation ${axis.toUpperCase()}`}
              value={toDeg(form.rotation[axis])}
              onChange={(e) => setVec("rotation", axis, toRad(Number(e.target.value) || 0))}
            />
          ))}
        </div>
        <span className="help">DB에는 라디안으로 저장됩니다. 책등이 통로를 향하도록 맞추세요.</span>
      </div>

      <VectorField
        label="Scale"
        value={form.scale}
        step={0.1}
        onChange={(axis, v) => setVec("scale", axis, v)}
      />

      <div className="form-actions">
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? "Saving..." : "Save"}
        </button>
        <button className="btn" type="button" onClick={() => router.push("/admin")}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function VectorField({
  label,
  value,
  step,
  onChange,
}: {
  label: string;
  value: { x: number; y: number; z: number };
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
            value={value[axis]}
            onChange={(e) => onChange(axis, Number(e.target.value) || 0)}
          />
        ))}
      </div>
    </div>
  );
}

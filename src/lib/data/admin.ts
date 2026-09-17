"use client";

import { projectToRow, rowToAbout, rowToProject } from "@/lib/supabase/mapper";
import { getSupabaseClient } from "@/lib/supabase/client";
import type {
  AboutProfile,
  AboutRow,
  Project,
  ProjectInput,
  ProjectRow,
} from "@/types/project";

class NotConfiguredError extends Error {
  constructor() {
    super("Supabase가 설정되지 않았습니다. .env.local 에 NEXT_PUBLIC_SUPABASE_URL / ANON_KEY 를 넣어 주세요.");
  }
}

function client() {
  const supabase = getSupabaseClient();
  if (!supabase) throw new NotConfiguredError();
  return supabase;
}

export async function listProjects(): Promise<Project[]> {
  const { data, error } = await client()
    .from("projects")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as ProjectRow[]).map(rowToProject);
}

export async function getProject(id: string): Promise<Project> {
  const { data, error } = await client().from("projects").select("*").eq("id", id).single();
  if (error) throw new Error(error.message);
  return rowToProject(data as ProjectRow);
}

export async function createProject(input: ProjectInput): Promise<Project> {
  const { data, error } = await client()
    .from("projects")
    .insert(projectToRow(input))
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return rowToProject(data as ProjectRow);
}

export async function updateProject(id: string, input: ProjectInput): Promise<Project> {
  const { data, error } = await client()
    .from("projects")
    .update({ ...projectToRow(input), updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return rowToProject(data as ProjectRow);
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await client().from("projects").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** RPD 43장 — 3D 에디터는 transform 값만 부분 갱신한다. */
export async function updateTransform(
  id: string,
  t: Pick<Project, "position" | "rotation" | "scale">,
): Promise<void> {
  const { error } = await client()
    .from("projects")
    .update({
      position_x: t.position.x,
      position_y: t.position.y,
      position_z: t.position.z,
      rotation_x: t.rotation.x,
      rotation_y: t.rotation.y,
      rotation_z: t.rotation.z,
      scale_x: t.scale.x,
      scale_y: t.scale.y,
      scale_z: t.scale.z,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getAbout(): Promise<AboutProfile | null> {
  const { data, error } = await client().from("about").select("*").limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToAbout(data as AboutRow) : null;
}

export async function upsertAbout(about: Omit<AboutProfile, "updatedAt">): Promise<void> {
  const { error } = await client().from("about").upsert({
    id: about.id,
    name: about.name,
    title: about.title,
    affiliation: about.affiliation,
    tagline: about.tagline,
    links: about.links,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

/**
 * RPD 23장 — 대표 이미지는 Supabase Storage(portfolio 버킷)에 저장한다.
 * projects/{projectId}/cover.webp 경로를 사용하고, 업로드 전에 WebP로 변환한다.
 */
export async function uploadCoverImage(projectId: string, file: File): Promise<string> {
  const supabase = client();
  const webp = await toWebp(file);
  const path = `projects/${projectId}/cover.webp`;

  const { error } = await supabase.storage
    .from("portfolio")
    .upload(path, webp, { contentType: "image/webp", upsert: true });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("portfolio").getPublicUrl(path);
  // 같은 경로에 upsert하므로 캐시 무효화를 위해 버전 쿼리를 붙인다.
  return `${data.publicUrl}?v=${Date.now()}`;
}

/** canvas로 WebP 재인코딩 + 장변 1600px 제한(RPD 28장 경량화 원칙). */
async function toWebp(file: File, maxEdge = 1600, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * ratio);
  const height = Math.round(bitmap.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality),
  );
  return blob ?? file;
}

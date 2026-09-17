"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * RPD 39장 — anon key는 공개되는 값이므로 숨기지 않는다.
 * 실제 권한 통제는 PostgreSQL RLS가 담당한다(supabase/schema.sql).
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

let cached: SupabaseClient | null = null;

/** 환경변수가 없으면 null — 호출부가 샘플 데이터로 폴백한다. */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  cached ??= createBrowserClient(url!, anonKey!);
  return cached;
}

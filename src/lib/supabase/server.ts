import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

/** 서버 컴포넌트에서 방문자용 SELECT를 수행할 때 사용. */
export async function getSupabaseServerClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured) return null;
  const cookieStore = await cookies();

  return createServerClient(url!, anonKey!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        // 서버 컴포넌트에서는 쿠키를 쓸 수 없다. 세션 갱신은 클라이언트가 처리한다.
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          /* noop */
        }
      },
    },
  });
}

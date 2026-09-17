"use client";

import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * RPD 17장 — 관리자 페이지는 Supabase Auth 로그인을 요구한다.
 * 실제 권한 통제는 RLS가 담당하므로, 이 컴포넌트는 UI 접근만 막는다.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setChecking(false);
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) return <SetupNotice />;
  if (checking) return <CenteredMessage text="Checking session..." />;
  if (!session) return <LoginForm />;

  return (
    <div className="admin">
      <div className="admin-shell">
        <AdminHeader email={session.user.email ?? ""} />
        {children}
      </div>
    </div>
  );
}

function AdminHeader({ email }: { email: string }) {
  const pathname = usePathname();
  const links = [
    { href: "/admin", label: "Projects" },
    { href: "/admin/editor", label: "Book Editor" },
    { href: "/admin/about", label: "About" },
    { href: "/", label: "View Site" },
  ];

  return (
    <header className="admin-header">
      <h1>Portfolio Admin</h1>
      <nav className="admin-nav">
        {links.map((link) => (
          <Link key={link.href} href={link.href} data-active={pathname === link.href}>
            {link.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => void getSupabaseClient()?.auth.signOut()}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            color: "var(--ink-faint)",
            cursor: "pointer",
            font: "inherit",
            letterSpacing: "inherit",
            textTransform: "uppercase",
          }}
          title={email}
        >
          Sign out
        </button>
      </nav>
    </header>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const supabase = getSupabaseClient();
    if (!supabase) return;

    setBusy(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    // 성공 시 onAuthStateChange가 화면을 전환한다.
    if (authError) setError(authError.message);
    setBusy(false);
  };

  return (
    <div className="admin">
      <div className="login">
        <form className="login-card" onSubmit={onSubmit}>
          <h1>The Library</h1>
          <div className="sub">Admin Access</div>

          {error && <div className="alert">{error}</div>}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              autoComplete="username"
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              autoComplete="current-password"
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button className="btn primary" type="submit" disabled={busy} style={{ width: "100%" }}>
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

function SetupNotice() {
  return (
    <div className="admin">
      <div className="admin-shell">
        <h1 style={{ letterSpacing: "0.14em", fontWeight: 500 }}>Setup required</h1>
        <div className="alert info">
          Supabase 환경변수가 설정되지 않았습니다.
          <br />
          <code>.env.local</code> 에 <code>NEXT_PUBLIC_SUPABASE_URL</code> 과{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> 를 채운 뒤{" "}
          <code>supabase/schema.sql</code> 을 실행하세요.
        </div>
        <p className="muted">
          환경변수가 없는 동안에도 <Link href="/">3D 도서관</Link>은 샘플 프로젝트로 동작합니다.
        </p>
      </div>
    </div>
  );
}

function CenteredMessage({ text }: { text: string }) {
  return (
    <div className="admin">
      <div className="login">
        <p className="muted">{text}</p>
      </div>
    </div>
  );
}

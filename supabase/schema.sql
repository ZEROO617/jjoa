-- 3D Library Portfolio — Supabase 스키마
-- Supabase Dashboard > SQL Editor 에 붙여넣어 실행하세요.
--
-- RPD 39장: anon key는 공개되는 값이므로 숨기지 않는다.
-- 실제 권한 통제는 아래 RLS 정책이 담당한다.
--   방문자(anon)  : SELECT 만
--   관리자(authenticated) : SELECT / INSERT / UPDATE / DELETE

-- ──────────────────────────── projects ────────────────────────────

create extension if not exists "pgcrypto";

create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),

  name        text not null,
  book_title  text not null,
  description text not null default '',

  start_date  text not null,
  end_date    text,

  project_url text,
  github_url  text,
  image_url   text,

  -- #RRGGBB
  book_color  text not null default '#4a2f1c'
    check (book_color ~ '^#[0-9a-fA-F]{6}$'),

  -- 책의 3D 배치 (회전은 라디안)
  position_x  double precision not null default 0,
  position_y  double precision not null default 1.34,
  position_z  double precision not null default 0,

  rotation_x  double precision not null default 0,
  rotation_y  double precision not null default 0,
  rotation_z  double precision not null default 0,

  scale_x     double precision not null default 1,
  scale_y     double precision not null default 1,
  scale_z     double precision not null default 1,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists projects_created_at_idx on public.projects (created_at);

-- ──────────────────────────── about ────────────────────────────
-- 중앙 동상에 표시되는 About 정보. 행은 하나만 유지한다.

create table if not exists public.about (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  title       text not null default '',
  affiliation text not null default '',
  tagline     text not null default '',
  links       jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now()
);

-- ──────────────────────────── updated_at 자동 갱신 ────────────────────────────

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_touch_updated_at on public.projects;
create trigger projects_touch_updated_at
  before update on public.projects
  for each row execute function public.touch_updated_at();

drop trigger if exists about_touch_updated_at on public.about;
create trigger about_touch_updated_at
  before update on public.about
  for each row execute function public.touch_updated_at();

-- ──────────────────────────── RLS ────────────────────────────

alter table public.projects enable row level security;
alter table public.about    enable row level security;

-- 방문자: 읽기만
drop policy if exists "projects are viewable by everyone" on public.projects;
create policy "projects are viewable by everyone"
  on public.projects for select
  using (true);

drop policy if exists "about is viewable by everyone" on public.about;
create policy "about is viewable by everyone"
  on public.about for select
  using (true);

-- 관리자(로그인 사용자): 전체 권한
-- 초기 버전은 관리자 계정이 하나뿐이므로 authenticated 역할 전체에 허용한다.
-- 계정을 더 늘릴 계획이라면 auth.uid() = '<관리자 uuid>' 로 좁히는 편이 안전하다.
drop policy if exists "projects are writable by authenticated" on public.projects;
create policy "projects are writable by authenticated"
  on public.projects for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "about is writable by authenticated" on public.about;
create policy "about is writable by authenticated"
  on public.about for all
  to authenticated
  using (true)
  with check (true);

-- ──────────────────────────── Storage ────────────────────────────
-- RPD 23장: 대표 이미지는 portfolio 버킷의 projects/{id}/cover.webp 에 저장한다.

insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

drop policy if exists "portfolio images are publicly readable" on storage.objects;
create policy "portfolio images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'portfolio');

drop policy if exists "portfolio images are writable by authenticated" on storage.objects;
create policy "portfolio images are writable by authenticated"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'portfolio')
  with check (bucket_id = 'portfolio');

-- ──────────────────────────── 초기 About 행 ────────────────────────────

insert into public.about (id, name, title, affiliation, tagline, links)
values (
  '00000000-0000-0000-0000-000000000001',
  'KIM YOONSEO',
  'Developer',
  'Global Media',
  E'Building things with\nCode, AI and Interactive Media.',
  '[]'::jsonb
)
on conflict (id) do nothing;

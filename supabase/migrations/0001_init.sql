-- rooquiz-blog 初始 schema
-- 在 Supabase SQL Editor 里整份执行一次；这个库只服务博客，与 rooquiz-payload 的库无关。
--
-- 分工：MDX 正文放 Storage（blog-content，private），这张表只存供列表/筛选/构建用的索引元数据。

create extension if not exists pg_trgm;

-- ============================================================
-- posts
-- ============================================================
create table if not exists posts (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null,
  locale           text not null check (locale in ('en', 'zh')),
  -- 同一篇文章跨语言的分组键，驱动 hreflang 互链
  translation_key  text not null,
  title            text not null,
  summary          text,
  cover_url        text,
  tags             text[] not null default '{}',
  author           text,
  status           text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  -- Storage 对象路径，形如 posts/en/how-to-build-a-quiz-funnel.mdx
  storage_path     text not null,
  -- sha256(mdx)，用于写入 API 幂等判重与构建期增量同步
  content_hash     text not null,
  reading_minutes  int,
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- 首版搜索走构建期 JSON 索引 + 客户端 MiniSearch（Supabase Postgres 无中文分词扩展）。
  -- 这列留给文章量上千后切回服务端英文检索，现在不查它。
  search_vector    tsvector generated always as (
                     to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, ''))
                   ) stored,
  unique (locale, slug)
);

create index if not exists posts_feed_idx        on posts (status, locale, published_at desc);
create index if not exists posts_tags_idx        on posts using gin (tags);
create index if not exists posts_translation_idx on posts (translation_key);
create index if not exists posts_search_idx      on posts using gin (search_vector);

-- updated_at 自动维护，免得写入 API 每次都要记得带上
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists posts_set_updated_at on posts;
create trigger posts_set_updated_at before update on posts
  for each row execute function set_updated_at();

-- ============================================================
-- post_views
-- ============================================================
create table if not exists post_views (
  post_id    uuid primary key references posts(id) on delete cascade,
  count      bigint not null default 0,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- comments —— 首版不接 UI，只预留结构，
-- 免得将来加评论时还要动 posts 的外键关系。
-- ============================================================
create table if not exists comments (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references posts(id) on delete cascade,
  parent_id    uuid references comments(id) on delete cascade,
  author_name  text not null,
  author_email text,
  body         text not null,
  status       text not null default 'pending' check (status in ('pending', 'approved', 'spam')),
  created_at   timestamptz not null default now()
);

create index if not exists comments_post_idx on comments (post_id, status, created_at);

-- ============================================================
-- RLS
-- 站点本身不用 anon key（构建期与 Route Handler 都走 service role，service role 绕过 RLS），
-- 这里开 RLS 是兜底：万一将来 anon key 泄漏或前端直连，草稿也不会漏出去。
-- ============================================================
alter table posts      enable row level security;
alter table post_views enable row level security;
alter table comments   enable row level security;

drop policy if exists posts_public_read on posts;
create policy posts_public_read on posts
  for select to anon
  using (status = 'published');

drop policy if exists post_views_public_read on post_views;
create policy post_views_public_read on post_views
  for select to anon
  using (true);

drop policy if exists comments_public_read on comments;
create policy comments_public_read on comments
  for select to anon
  using (status = 'approved');

-- ============================================================
-- 阅读量自增。security definer 让它能绕过 post_views 的 RLS 写入，
-- 但只由服务端 Route Handler 调用，不暴露给 anon。
-- ============================================================
create or replace function increment_post_view(p_post_id uuid) returns bigint
language plpgsql security definer
set search_path = public
as $$
declare
  v_count bigint;
begin
  insert into post_views (post_id, count)
  values (p_post_id, 1)
  on conflict (post_id)
    do update set count = post_views.count + 1, updated_at = now()
  returning count into v_count;

  return v_count;
end $$;

revoke all on function increment_post_view(uuid) from public, anon;

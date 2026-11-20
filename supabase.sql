begin;
-- 在 Supabase 控制台 → SQL Editor 里整段运行
create table public.messages (
  id bigint generated always as identity primary key,
  text text not null check (char_length(text) between 1 and 100),
  hidden boolean not null default false,      -- 想隐藏某条留言：在 Table Editor 里把 hidden 改成 true
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
grant select, insert on public.messages to anon;
create policy "anyone can read visible" on public.messages for select to anon using (hidden = false);
create policy "anyone can insert" on public.messages for insert to anon with check (hidden = false and char_length(text) between 1 and 100);
-- 没有 update / delete 策略：匿名访客无法修改或删除任何留言
commit;

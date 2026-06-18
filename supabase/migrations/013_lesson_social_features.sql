create table if not exists public.lesson_likes (
  id uuid default gen_random_uuid() primary key,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(lesson_id, user_id)
);
alter table public.lesson_likes enable row level security;
create index if not exists lesson_likes_lesson_id_idx on public.lesson_likes(lesson_id);

create table if not exists public.lesson_favorites (
  id uuid default gen_random_uuid() primary key,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(lesson_id, user_id)
);
alter table public.lesson_favorites enable row level security;
create index if not exists lesson_favorites_lesson_id_idx on public.lesson_favorites(lesson_id);
create index if not exists lesson_favorites_user_id_idx on public.lesson_favorites(user_id);

create table if not exists public.lesson_comment_likes (
  id uuid default gen_random_uuid() primary key,
  comment_id uuid references public.lesson_comments(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(comment_id, user_id)
);
alter table public.lesson_comment_likes enable row level security;
create index if not exists lesson_comment_likes_comment_id_idx on public.lesson_comment_likes(comment_id);

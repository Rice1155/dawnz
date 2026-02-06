-- ═══════════════════════════════════════════════════════════════
-- SPARKS & REFLECTIONS TABLES
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- SPARKS TABLE (Quick thoughts, 200 char limit)
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.sparks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  book_id uuid references public.books(id) on delete cascade,  -- nullable for "no book" sparks
  chapter_number int,  -- tied to chapter if available
  content text not null check (char_length(content) <= 200),
  quote text,  -- optional quote from the book
  emoji text check (emoji is null or char_length(emoji) <= 10),  -- single emoji
  is_public boolean default false,
  share_token uuid unique,  -- for shareable links
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════
-- USER_REFLECTIONS TABLE (Deeper thoughts, no limit)
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.user_reflections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  book_id uuid references public.books(id) on delete cascade,  -- nullable for "no book" reflections
  content text not null,
  quote text,  -- optional quote from the book
  emoji text check (emoji is null or char_length(emoji) <= 10),  -- single emoji
  tags text[] default '{}',  -- e.g., ["come back to", "favorite moment", "theme"]
  is_public boolean default false,
  share_token uuid unique,  -- for shareable links
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════
-- PROMPTS TABLE (Optional prompts for inspiration)
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.spark_prompts (
  id uuid default gen_random_uuid() primary key,
  prompt text not null,
  type text default 'general' check (type in ('general', 'genre', 'daily')),
  genres text[] default '{}',  -- for genre-specific prompts
  active boolean default true,
  created_at timestamptz default now()
);

-- Insert default prompts
insert into public.spark_prompts (prompt, type) values
  ('What surprised you in your reading today?', 'general'),
  ('Share a line that stuck with you.', 'general'),
  ('How are you feeling about the story so far?', 'general'),
  ('What would you ask the author right now?', 'general'),
  ('Describe this book in one emoji.', 'general'),
  ('What''s one thing you''ve learned?', 'general'),
  ('Would you recommend this to a friend? Why?', 'general'),
  ('What character do you relate to most?', 'general'),
  ('Is this book what you expected?', 'general'),
  ('What''s your favorite moment so far?', 'general'),
  ('What predictions do you have?', 'general'),
  ('How does this book make you feel?', 'general'),
  ('What themes are emerging?', 'general'),
  ('Who would love this book?', 'general'),
  ('What''s the vibe of this book?', 'general');

-- Genre-specific prompts
insert into public.spark_prompts (prompt, type, genres) values
  ('Any plot twists you didn''t see coming?', 'genre', array['mystery', 'thriller']),
  ('Are you rooting for the romance?', 'genre', array['romance']),
  ('How''s the world-building?', 'genre', array['fantasy', 'science_fiction']),
  ('What life lesson stood out?', 'genre', array['self-help', 'biography']),
  ('Is the magic system making sense?', 'genre', array['fantasy']),
  ('How plausible is the science?', 'genre', array['science_fiction']);

-- ═══════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════
create index if not exists sparks_user_id_idx on public.sparks(user_id);
create index if not exists sparks_book_id_idx on public.sparks(book_id);
create index if not exists sparks_created_at_idx on public.sparks(user_id, created_at desc);
create index if not exists sparks_share_token_idx on public.sparks(share_token) where share_token is not null;

create index if not exists user_reflections_user_id_idx on public.user_reflections(user_id);
create index if not exists user_reflections_book_id_idx on public.user_reflections(book_id);
create index if not exists user_reflections_created_at_idx on public.user_reflections(user_id, created_at desc);
create index if not exists user_reflections_share_token_idx on public.user_reflections(share_token) where share_token is not null;

-- ═══════════════════════════════════════════════════════════════
-- ENABLE ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════
alter table public.sparks enable row level security;
alter table public.user_reflections enable row level security;
alter table public.spark_prompts enable row level security;

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES - SPARKS
-- ═══════════════════════════════════════════════════════════════
create policy "Users can view their own sparks"
  on public.sparks for select using (auth.uid() = user_id);

create policy "Users can view public sparks"
  on public.sparks for select using (is_public = true);

create policy "Anyone can view shared sparks by token"
  on public.sparks for select using (share_token is not null);

create policy "Users can insert their own sparks"
  on public.sparks for insert with check (auth.uid() = user_id);

create policy "Users can update their own sparks"
  on public.sparks for update using (auth.uid() = user_id);

create policy "Users can delete their own sparks"
  on public.sparks for delete using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES - USER_REFLECTIONS
-- ═══════════════════════════════════════════════════════════════
create policy "Users can view their own reflections"
  on public.user_reflections for select using (auth.uid() = user_id);

create policy "Users can view public reflections"
  on public.user_reflections for select using (is_public = true);

create policy "Anyone can view shared reflections by token"
  on public.user_reflections for select using (share_token is not null);

create policy "Users can insert their own reflections"
  on public.user_reflections for insert with check (auth.uid() = user_id);

create policy "Users can update their own reflections"
  on public.user_reflections for update using (auth.uid() = user_id);

create policy "Users can delete their own reflections"
  on public.user_reflections for delete using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES - SPARK_PROMPTS
-- ═══════════════════════════════════════════════════════════════
create policy "Prompts are viewable by everyone"
  on public.spark_prompts for select using (active = true);

-- ═══════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════
drop trigger if exists set_updated_at on public.sparks;
create trigger set_updated_at
  before update on public.sparks
  for each row execute procedure public.handle_updated_at();

drop trigger if exists set_updated_at on public.user_reflections;
create trigger set_updated_at
  before update on public.user_reflections
  for each row execute procedure public.handle_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- DONE!
-- ═══════════════════════════════════════════════════════════════

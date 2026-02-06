-- ═══════════════════════════════════════════════════════════════
-- DAWNZ DATABASE SCHEMA
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- ENUMS (create first as they're used by tables)
-- ═══════════════════════════════════════════════════════════════
create type book_status as enum ('want_to_read', 'reading', 'finished', 'dnf');
create type friendship_status as enum ('pending', 'accepted', 'declined');
create type invite_status as enum ('pending', 'accepted', 'expired');

-- ═══════════════════════════════════════════════════════════════
-- PROFILES TABLE
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  location text,
  website text,
  favorite_genres text[] default '{}',
  curious_topics text[] default '{}',
  reading_goal_yearly int default 12,
  onboarding_complete boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════
-- BOOKS TABLE
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.books (
  id uuid default gen_random_uuid() primary key,
  isbn13 text unique,
  isbn10 text,
  open_library_key text unique,
  title text not null,
  authors text[] default '{}',
  description text,
  cover_small text,
  cover_medium text,
  cover_large text,
  published_date text,
  publisher text,
  page_count int,
  chapter_count int,
  genres text[] default '{}',
  subjects text[] default '{}',
  language text default 'en',
  source text default 'open_library',
  fetched_at timestamptz default now(),
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════
-- FRIENDSHIPS TABLE (create early, needed by other policies)
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.friendships (
  id uuid default gen_random_uuid() primary key,
  requester_id uuid references public.profiles(id) on delete cascade not null,
  addressee_id uuid references public.profiles(id) on delete cascade not null,
  status friendship_status default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(requester_id, addressee_id),
  check (requester_id != addressee_id)
);

-- ═══════════════════════════════════════════════════════════════
-- USER_BOOKS TABLE
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.user_books (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  book_id uuid references public.books(id) on delete cascade not null,
  status book_status default 'want_to_read',
  current_page int default 0,
  current_chapter int default 0,
  rating smallint check (rating >= 1 and rating <= 5),
  review text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, book_id)
);

-- ═══════════════════════════════════════════════════════════════
-- READING_REFLECTIONS TABLE
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.reading_reflections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  book_id uuid references public.books(id) on delete cascade not null,
  user_book_id uuid references public.user_books(id) on delete cascade not null,
  question text not null,
  answer text,
  chapter_number int,
  page_number int,
  percentage_complete int,
  is_public boolean default false,
  share_with_friends boolean default true,
  ai_generated boolean default true,
  likes_count int default 0,
  created_at timestamptz default now(),
  answered_at timestamptz
);

-- ═══════════════════════════════════════════════════════════════
-- FRIEND_INVITES TABLE
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.friend_invites (
  id uuid default gen_random_uuid() primary key,
  inviter_id uuid references public.profiles(id) on delete cascade not null,
  email text not null,
  token uuid default gen_random_uuid() unique not null,
  status invite_status default 'pending',
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '7 days'),
  accepted_at timestamptz,
  unique(inviter_id, email)
);

-- ═══════════════════════════════════════════════════════════════
-- FAVORITE_BOOKS TABLE
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.favorite_books (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  book_id uuid references public.books(id) on delete cascade not null,
  display_order int default 0,
  created_at timestamptz default now(),
  unique(user_id, book_id)
);

-- ═══════════════════════════════════════════════════════════════
-- REFLECTION_LIKES TABLE
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.reflection_likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  reflection_id uuid references public.reading_reflections(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, reflection_id)
);

-- ═══════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════
create index if not exists books_isbn13_idx on public.books(isbn13);
create index if not exists books_open_library_key_idx on public.books(open_library_key);
create index if not exists books_title_idx on public.books using gin(to_tsvector('english', title));
create index if not exists user_books_user_id_idx on public.user_books(user_id);
create index if not exists user_books_status_idx on public.user_books(user_id, status);
create index if not exists reflections_user_book_idx on public.reading_reflections(user_book_id);
create index if not exists friendships_requester_idx on public.friendships(requester_id);
create index if not exists friendships_addressee_idx on public.friendships(addressee_id);

-- ═══════════════════════════════════════════════════════════════
-- ENABLE ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════
alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.user_books enable row level security;
alter table public.reading_reflections enable row level security;
alter table public.friendships enable row level security;
alter table public.friend_invites enable row level security;
alter table public.favorite_books enable row level security;
alter table public.reflection_likes enable row level security;

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES - PROFILES
-- ═══════════════════════════════════════════════════════════════
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES - BOOKS
-- ═══════════════════════════════════════════════════════════════
create policy "Books are viewable by everyone"
  on public.books for select using (true);

create policy "Authenticated users can insert books"
  on public.books for insert with check (auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES - FRIENDSHIPS
-- ═══════════════════════════════════════════════════════════════
create policy "Users can view their own friendships"
  on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "Users can send friend requests"
  on public.friendships for insert with check (auth.uid() = requester_id);

create policy "Users can update friendships they're part of"
  on public.friendships for update
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "Users can delete their own friendships"
  on public.friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES - USER_BOOKS
-- ═══════════════════════════════════════════════════════════════
create policy "Users can view their own books"
  on public.user_books for select using (auth.uid() = user_id);

create policy "Users can view friends books"
  on public.user_books for select
  using (
    exists (
      select 1 from public.friendships
      where status = 'accepted'
      and ((requester_id = auth.uid() and addressee_id = user_id)
        or (addressee_id = auth.uid() and requester_id = user_id))
    )
  );

create policy "Users can insert their own books"
  on public.user_books for insert with check (auth.uid() = user_id);

create policy "Users can update their own books"
  on public.user_books for update using (auth.uid() = user_id);

create policy "Users can delete their own books"
  on public.user_books for delete using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES - READING_REFLECTIONS
-- ═══════════════════════════════════════════════════════════════
create policy "Users can view their own reflections"
  on public.reading_reflections for select using (auth.uid() = user_id);

create policy "Users can view public reflections"
  on public.reading_reflections for select
  using (is_public = true and answer is not null);

create policy "Users can view friends shared reflections"
  on public.reading_reflections for select
  using (
    share_with_friends = true
    and answer is not null
    and exists (
      select 1 from public.friendships
      where status = 'accepted'
      and ((requester_id = auth.uid() and addressee_id = user_id)
        or (addressee_id = auth.uid() and requester_id = user_id))
    )
  );

create policy "Users can insert their own reflections"
  on public.reading_reflections for insert with check (auth.uid() = user_id);

create policy "Users can update their own reflections"
  on public.reading_reflections for update using (auth.uid() = user_id);

create policy "Users can delete their own reflections"
  on public.reading_reflections for delete using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES - FRIEND_INVITES
-- ═══════════════════════════════════════════════════════════════
create policy "Users can view their own invites"
  on public.friend_invites for select using (auth.uid() = inviter_id);

create policy "Users can create invites"
  on public.friend_invites for insert with check (auth.uid() = inviter_id);

create policy "Anyone can view invite by token for signup"
  on public.friend_invites for select using (true);

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES - FAVORITE_BOOKS
-- ═══════════════════════════════════════════════════════════════
create policy "Favorite books are viewable by everyone"
  on public.favorite_books for select using (true);

create policy "Users can manage their own favorites"
  on public.favorite_books for insert with check (auth.uid() = user_id);

create policy "Users can update their own favorites"
  on public.favorite_books for update using (auth.uid() = user_id);

create policy "Users can delete their own favorites"
  on public.favorite_books for delete using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES - REFLECTION_LIKES
-- ═══════════════════════════════════════════════════════════════
create policy "Users can view likes"
  on public.reflection_likes for select using (true);

create policy "Users can like reflections"
  on public.reflection_likes for insert with check (auth.uid() = user_id);

create policy "Users can unlike"
  on public.reflection_likes for delete using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- Handle new user signup - create profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Update likes count on reflection
create or replace function public.update_reflection_likes_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.reading_reflections
    set likes_count = likes_count + 1
    where id = NEW.reflection_id;
  elsif TG_OP = 'DELETE' then
    update public.reading_reflections
    set likes_count = likes_count - 1
    where id = OLD.reflection_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════

-- Create profile on user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update likes count
drop trigger if exists on_reflection_like_change on public.reflection_likes;
create trigger on_reflection_like_change
  after insert or delete on public.reflection_likes
  for each row execute procedure public.update_reflection_likes_count();

-- Auto-update updated_at
drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

drop trigger if exists set_updated_at on public.user_books;
create trigger set_updated_at
  before update on public.user_books
  for each row execute procedure public.handle_updated_at();

drop trigger if exists set_updated_at on public.friendships;
create trigger set_updated_at
  before update on public.friendships
  for each row execute procedure public.handle_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- VIEWS
-- ═══════════════════════════════════════════════════════════════
create or replace view public.user_reading_stats as
select
  user_id,
  count(*) filter (where status = 'finished') as books_finished,
  count(*) filter (where status = 'reading') as books_reading,
  count(*) filter (where status = 'want_to_read') as books_want_to_read,
  count(*) filter (where status = 'finished' and finished_at >= date_trunc('year', now())) as books_finished_this_year,
  coalesce(avg(rating) filter (where rating is not null), 0) as average_rating
from public.user_books
group by user_id;

grant select on public.user_reading_stats to authenticated;

-- ═══════════════════════════════════════════════════════════════
-- DONE!
-- ═══════════════════════════════════════════════════════════════

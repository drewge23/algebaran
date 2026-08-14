-- Algebaran backend — schema, policies and server-side game logic.
--
-- Design notes
-- ============
-- * MINIMAL DATA. The audience is schoolchildren, so the only personal data
--   stored is a chosen username and an emoji. No email, no real names. Sign-up
--   synthesises an unreachable address (`<username>@algebaran.invalid`) purely
--   because Supabase Auth requires one.
-- * THE SERVER OWNS REWARDS. Once a leaderboard exists, any number the client
--   computes is forgeable by editing localStorage. So π/XP come from a rewards
--   table the client cannot write, duel scoring is graded from submitted answer
--   indices against answers the client never receives, and ratings are computed
--   here.
-- * RLS EVERYWHERE. Every table denies access by default; a user can only read
--   and write their own rows. Anything cross-user (leaderboards, duels) goes
--   through `security definer` functions with a narrow, audited surface.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------

-- Public-facing identity. Deliberately holds nothing that identifies a child.
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text not null unique check (char_length(username) between 2 and 16),
  avatar text not null default '🧑‍🚀',
  created_at timestamptz not null default now()
);

-- The save file: one row per player.
create table if not exists public.player_state (
  user_id uuid primary key references auth.users on delete cascade,
  pi integer not null default 0 check (pi >= 0),
  xp integer not null default 0 check (xp >= 0),
  rating integer not null default 1000 check (rating >= 100),
  duel_wins integer not null default 0,
  duel_losses integer not null default 0,
  streak_count integer not null default 0,
  last_active_date date,
  owned_item_ids text[] not null default '{}',
  unlocked_key_ids text[] not null default '{}',
  equipped_avatar_id text not null default 'starter-star',
  language text,
  updated_at timestamptz not null default now()
);

-- Lesson and project completions, kept apart so project runs never inflate the
-- lesson count.
create table if not exists public.progress (
  user_id uuid not null references auth.users on delete cascade,
  kind text not null check (kind in ('lesson', 'project')),
  item_id text not null,
  stars smallint not null default 1 check (stars between 1 and 3),
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, item_id)
);

-- ---------------------------------------------------------------------------
-- Content the server must know about (so the client cannot invent payouts)
-- ---------------------------------------------------------------------------

create table if not exists public.rewards (
  kind text not null check (kind in ('lesson', 'project')),
  item_id text not null,
  reward_pi integer not null check (reward_pi >= 0),
  reward_xp integer not null check (reward_xp >= 0),
  primary key (kind, item_id)
);

create table if not exists public.shop_items (
  id text primary key,
  cost integer not null check (cost >= 0),
  kind text not null check (kind in ('avatar', 'collectable', 'consumable', 'key')),
  key_id text
);

-- The duel question bank. `correct_index` must never reach the client, which is
-- why the base table stays unreadable and a view exposes the safe columns.
create table if not exists public.quickfire (
  id integer primary key,
  equation text not null,
  prompt text not null,
  options text[] not null,
  correct_index smallint not null
);

create or replace view public.quickfire_public as
  select id, equation, prompt, options from public.quickfire;

-- ---------------------------------------------------------------------------
-- Duels (asynchronous)
-- ---------------------------------------------------------------------------

-- Both players answer the same fixed set, whenever they happen to open the app.
-- `status`: open  = waiting for an opponent to join
--           ready = matched, waiting for one or both runs
--           done  = graded, ratings applied
create table if not exists public.duels (
  id uuid primary key default gen_random_uuid(),
  question_ids integer[] not null,
  challenger uuid not null references auth.users on delete cascade,
  opponent uuid references auth.users on delete cascade,
  challenger_correct smallint,
  challenger_ms integer,
  opponent_correct smallint,
  opponent_ms integer,
  challenger_rating_before integer,
  opponent_rating_before integer,
  challenger_delta integer,
  opponent_delta integer,
  status text not null default 'open' check (status in ('open', 'ready', 'done')),
  winner uuid,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists duels_open_idx on public.duels (status, created_at)
  where status = 'open';
create index if not exists duels_participants_idx on public.duels (challenger, opponent);

-- ---------------------------------------------------------------------------
-- Leagues (weekly cohorts, Duolingo-style)
-- ---------------------------------------------------------------------------

create table if not exists public.leagues (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  tier smallint not null check (tier between 1 and 5),
  created_at timestamptz not null default now()
);

create index if not exists leagues_week_tier_idx on public.leagues (week_start, tier);

create table if not exists public.league_members (
  league_id uuid not null references public.leagues on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  weekly_xp integer not null default 0 check (weekly_xp >= 0),
  joined_at timestamptz not null default now(),
  primary key (league_id, user_id)
);

create index if not exists league_members_user_idx on public.league_members (user_id);

-- How many players share a league, and how many move each week.
create or replace function public.league_size() returns integer
  language sql immutable as $$ select 20 $$;
create or replace function public.league_move_count() returns integer
  language sql immutable as $$ select 5 $$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.player_state enable row level security;
alter table public.progress enable row level security;
alter table public.rewards enable row level security;
alter table public.shop_items enable row level security;
alter table public.quickfire enable row level security;
alter table public.duels enable row level security;
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;

-- Profiles are readable by signed-in users: leaderboards need to show a
-- username and avatar. Nothing else about a player is exposed.
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select to authenticated using (true);

drop policy if exists profiles_write_own on public.profiles;
create policy profiles_write_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- A save file is private to its owner.
drop policy if exists player_state_own on public.player_state;
create policy player_state_own on public.player_state
  for select to authenticated using (user_id = auth.uid());

drop policy if exists progress_own on public.progress;
create policy progress_own on public.progress
  for select to authenticated using (user_id = auth.uid());

-- Reward tables are read-only reference data.
drop policy if exists rewards_read on public.rewards;
create policy rewards_read on public.rewards for select to authenticated using (true);

drop policy if exists shop_read on public.shop_items;
create policy shop_read on public.shop_items for select to authenticated using (true);

-- NOTE: no select policy on `quickfire` on purpose — the answers stay server
-- side. Clients read `quickfire_public` instead.

-- You may see duels you are in, plus open ones so matchmaking can find them.
drop policy if exists duels_visible on public.duels;
create policy duels_visible on public.duels
  for select to authenticated
  using (challenger = auth.uid() or opponent = auth.uid() or status = 'open');

-- Leagues and standings are readable; all writes happen in functions.
drop policy if exists leagues_read on public.leagues;
create policy leagues_read on public.leagues for select to authenticated using (true);

drop policy if exists league_members_read on public.league_members;
create policy league_members_read on public.league_members
  for select to authenticated using (true);

-- The answer key is not reachable through the API at all.
revoke all on public.quickfire from anon, authenticated;
grant select on public.quickfire_public to authenticated;

-- ---------------------------------------------------------------------------
-- Sign-up: create the profile and save file automatically
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
begin
  -- The client passes `username` in the sign-up metadata.
  v_username := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    'explorer_' || substr(new.id::text, 1, 6)
  );

  insert into public.profiles (id, username, avatar)
  values (
    new.id,
    v_username,
    coalesce(nullif(new.raw_user_meta_data ->> 'avatar', ''), '🧑‍🚀')
  );

  insert into public.player_state (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Lets the sign-up screen check a username before creating an account, without
-- exposing the profiles table to anonymous users.
create or replace function public.username_available(p_username text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.profiles where lower(username) = lower(trim(p_username))
  );
$$;

grant execute on function public.username_available(text) to anon, authenticated;

-- Monday of the current week, in UTC.
create or replace function public.current_week_start()
returns date
language sql
stable
as $$ select (date_trunc('week', now() at time zone 'utc'))::date $$;

-- ---------------------------------------------------------------------------
-- Leagues: lazy weekly placement
-- ---------------------------------------------------------------------------

-- Placing players lazily (on their first activity of the week) avoids needing a
-- scheduled job: promotion and demotion are derived from last week's finishing
-- position at the moment someone shows up.
create or replace function public.join_current_league()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_week date := public.current_week_start();
  v_league uuid;
  v_prev_tier smallint;
  v_prev_rank integer;
  v_prev_size integer;
  v_tier smallint := 1;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  select lm.league_id into v_league
  from public.league_members lm
  join public.leagues l on l.id = lm.league_id
  where lm.user_id = v_uid and l.week_start = v_week;
  if v_league is not null then return v_league; end if;

  -- Where did they finish last week?
  select l.tier, r.rnk, r.total
  into v_prev_tier, v_prev_rank, v_prev_size
  from public.league_members lm
  join public.leagues l on l.id = lm.league_id
  join (
    select lm2.league_id, lm2.user_id,
           rank() over (partition by lm2.league_id order by lm2.weekly_xp desc) as rnk,
           count(*) over (partition by lm2.league_id) as total
    from public.league_members lm2
  ) r on r.league_id = lm.league_id and r.user_id = lm.user_id
  where lm.user_id = v_uid and l.week_start = v_week - 7;

  if v_prev_tier is not null then
    v_tier := v_prev_tier;
    if v_prev_rank <= public.league_move_count() then
      v_tier := least(5, v_prev_tier + 1);
    elsif v_prev_size >= public.league_size()
      and v_prev_rank > v_prev_size - public.league_move_count() then
      v_tier := greatest(1, v_prev_tier - 1);
    end if;
  end if;

  -- Slot into a league with room, or open a new one.
  select l.id into v_league
  from public.leagues l
  where l.week_start = v_week and l.tier = v_tier
    and (select count(*) from public.league_members m where m.league_id = l.id)
        < public.league_size()
  order by l.created_at
  limit 1;

  if v_league is null then
    insert into public.leagues (week_start, tier) values (v_week, v_tier)
    returning id into v_league;
  end if;

  insert into public.league_members (league_id, user_id)
  values (v_league, v_uid)
  on conflict do nothing;

  return v_league;
end;
$$;

grant execute on function public.join_current_league() to authenticated;

-- Adds to this week's league tally. Called by the reward functions, never
-- directly by the client.
create or replace function public.add_weekly_xp(p_uid uuid, p_amount integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_week date := public.current_week_start();
  v_league uuid;
begin
  if p_amount <= 0 then return; end if;

  select lm.league_id into v_league
  from public.league_members lm
  join public.leagues l on l.id = lm.league_id
  where lm.user_id = p_uid and l.week_start = v_week;

  if v_league is null then return; end if;

  update public.league_members
  set weekly_xp = weekly_xp + p_amount
  where league_id = v_league and user_id = p_uid;
end;
$$;

-- The standings for the caller's current league.
create or replace function public.league_standings()
returns table (
  user_id uuid,
  username text,
  avatar text,
  weekly_xp integer,
  position integer,
  is_me boolean,
  tier smallint,
  promotes boolean,
  demotes boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_league uuid;
  v_tier smallint;
  v_total integer;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  v_league := public.join_current_league();
  select l.tier into v_tier from public.leagues l where l.id = v_league;
  select count(*) into v_total from public.league_members where league_id = v_league;

  return query
  select lm.user_id,
         p.username,
         p.avatar,
         lm.weekly_xp,
         (rank() over (order by lm.weekly_xp desc, lm.joined_at))::integer as position,
         lm.user_id = v_uid as is_me,
         v_tier as tier,
         (rank() over (order by lm.weekly_xp desc, lm.joined_at))
           <= public.league_move_count() as promotes,
         v_total >= public.league_size()
           and (rank() over (order by lm.weekly_xp desc, lm.joined_at))
               > v_total - public.league_move_count() as demotes
  from public.league_members lm
  join public.profiles p on p.id = lm.user_id
  where lm.league_id = v_league
  order by lm.weekly_xp desc, lm.joined_at;
end;
$$;

grant execute on function public.league_standings() to authenticated;

-- ---------------------------------------------------------------------------
-- Progress and rewards (server-granted)
-- ---------------------------------------------------------------------------

-- The client reports *what it finished*, never what it earned. Payouts come
-- from `rewards`, and a given item only ever pays once.
create or replace function public.record_progress(
  p_kind text,
  p_item_id text,
  p_stars integer
)
returns public.player_state
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_first_time boolean;
  v_pi integer := 0;
  v_xp integer := 0;
  v_today date := (now() at time zone 'utc')::date;
  v_last date;
  v_streak integer;
  v_multiplier numeric;
  v_state public.player_state;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_kind not in ('lesson', 'project') then raise exception 'bad kind'; end if;
  if p_stars is null or p_stars < 1 or p_stars > 3 then raise exception 'bad stars'; end if;

  -- Unknown ids simply pay nothing, so a forged id cannot mint currency.
  select r.reward_pi, r.reward_xp into v_pi, v_xp
  from public.rewards r
  where r.kind = p_kind and r.item_id = p_item_id;

  v_first_time := not exists (
    select 1 from public.progress
    where user_id = v_uid and kind = p_kind and item_id = p_item_id
  );

  insert into public.progress (user_id, kind, item_id, stars)
  values (v_uid, p_kind, p_item_id, p_stars)
  on conflict (user_id, kind, item_id) do update
    set stars = greatest(public.progress.stars, excluded.stars),
        updated_at = now();

  if not v_first_time or v_pi is null then
    -- Replays record stars but never pay again.
    select * into v_state from public.player_state where user_id = v_uid;
    return v_state;
  end if;

  -- Collectables multiply π income, exactly as the client's economy does.
  select 1 + coalesce(sum(
    case s.id
      when 'avatar-comet' then 0.1
      when 'avatar-saturn' then 0.25
      when 'collectable-galaxy' then 0.5
      else 0
    end), 0)
  into v_multiplier
  from public.player_state ps
  left join public.shop_items s on s.id = any (ps.owned_item_ids)
  where ps.user_id = v_uid;

  select last_active_date, streak_count into v_last, v_streak
  from public.player_state where user_id = v_uid;

  update public.player_state ps
  set pi = ps.pi + round(v_pi * coalesce(v_multiplier, 1)),
      xp = ps.xp + v_xp,
      streak_count = case
        when v_last = v_today then ps.streak_count
        when v_last = v_today - 1 then ps.streak_count + 1
        else 1
      end,
      last_active_date = v_today,
      updated_at = now()
  where ps.user_id = v_uid
  returning * into v_state;

  perform public.join_current_league();
  perform public.add_weekly_xp(v_uid, v_xp);

  return v_state;
end;
$$;

grant execute on function public.record_progress(text, text, integer) to authenticated;

-- Purchases are settled server-side so π cannot be spent it does not have.
create or replace function public.purchase_item(p_item_id text)
returns public.player_state
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_item public.shop_items;
  v_state public.player_state;
  v_bonus integer := 0;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  select * into v_item from public.shop_items where id = p_item_id;
  if v_item.id is null then raise exception 'unknown item'; end if;

  select * into v_state from public.player_state where user_id = v_uid;
  if v_state.pi < v_item.cost then raise exception 'insufficient funds'; end if;
  if v_item.kind <> 'consumable' and v_item.id = any (v_state.owned_item_ids) then
    raise exception 'already owned';
  end if;

  -- Fortune cookie: a random payout, rolled on the server.
  if v_item.kind = 'consumable' then
    v_bonus := 10 + floor(random() * 191)::integer;
  end if;

  update public.player_state ps
  set pi = ps.pi - v_item.cost + v_bonus,
      owned_item_ids = case
        when v_item.kind = 'consumable' then ps.owned_item_ids
        else array_append(ps.owned_item_ids, v_item.id)
      end,
      unlocked_key_ids = case
        when v_item.kind = 'key' and v_item.key_id is not null
          then array_append(ps.unlocked_key_ids, v_item.key_id)
        else ps.unlocked_key_ids
      end,
      updated_at = now()
  where ps.user_id = v_uid
  returning * into v_state;

  return v_state;
end;
$$;

grant execute on function public.purchase_item(text) to authenticated;

-- Cosmetic-only preferences the client may set directly.
create or replace function public.update_preferences(
  p_equipped_avatar_id text default null,
  p_language text default null
)
returns public.player_state
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_state public.player_state;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  update public.player_state ps
  set equipped_avatar_id = coalesce(p_equipped_avatar_id, ps.equipped_avatar_id),
      language = coalesce(p_language, ps.language),
      updated_at = now()
  where ps.user_id = v_uid
  returning * into v_state;
  return v_state;
end;
$$;

grant execute on function public.update_preferences(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Duels
-- ---------------------------------------------------------------------------

-- Joins the oldest waiting duel from someone else, or opens one. Returns the
-- duel and its questions *without* the answer key.
create or replace function public.find_duel(p_questions integer default 5)
returns table (
  duel_id uuid,
  role text,
  opponent_username text,
  opponent_avatar text,
  opponent_rating integer,
  questions jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_duel public.duels;
  v_my_rating integer;
  v_ids integer[];
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  select rating into v_my_rating from public.player_state where user_id = v_uid;

  -- Rejoin an unfinished duel before starting anything new.
  select * into v_duel from public.duels d
  where d.status = 'ready'
    and ((d.challenger = v_uid and d.challenger_correct is null)
      or (d.opponent = v_uid and d.opponent_correct is null))
  order by d.created_at
  limit 1;

  if v_duel.id is null then
    -- Claim the closest-rated waiting challenge that is not our own.
    select d.* into v_duel
    from public.duels d
    join public.player_state ps on ps.user_id = d.challenger
    where d.status = 'open' and d.challenger <> v_uid
    order by abs(ps.rating - v_my_rating), d.created_at
    limit 1
    for update skip locked;

    if v_duel.id is not null then
      update public.duels
      set opponent = v_uid,
          opponent_rating_before = v_my_rating,
          status = 'ready'
      where id = v_duel.id
      returning * into v_duel;
    else
      -- Nobody waiting: post a challenge for the next player to pick up.
      select array_agg(q.id) into v_ids
      from (select id from public.quickfire order by random() limit p_questions) q;

      insert into public.duels (question_ids, challenger, challenger_rating_before)
      values (v_ids, v_uid, v_my_rating)
      returning * into v_duel;
    end if;
  end if;

  return query
  select v_duel.id,
         case when v_duel.challenger = v_uid then 'challenger' else 'opponent' end,
         p.username,
         p.avatar,
         case when v_duel.challenger = v_uid
              then v_duel.opponent_rating_before
              else v_duel.challenger_rating_before end,
         (
           select jsonb_agg(jsonb_build_object(
                    'id', q.id, 'equation', q.equation,
                    'prompt', q.prompt, 'options', q.options)
                  order by array_position(v_duel.question_ids, q.id))
           from public.quickfire q
           where q.id = any (v_duel.question_ids)
         )
  from (select 1) _
  left join public.profiles p
    on p.id = case when v_duel.challenger = v_uid then v_duel.opponent else v_duel.challenger end;
end;
$$;

grant execute on function public.find_duel(integer) to authenticated;

-- Grades a run from the submitted answer indices, then resolves the duel once
-- both sides are in. The client never sends a score, only its choices.
create or replace function public.submit_duel(
  p_duel_id uuid,
  p_answers integer[],
  p_total_ms integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_duel public.duels;
  v_correct smallint := 0;
  v_i integer;
  v_is_challenger boolean;
  v_expected smallint;
  -- resolution
  v_c_correct smallint; v_c_ms integer; v_o_correct smallint; v_o_ms integer;
  v_c_rating integer; v_o_rating integer;
  v_c_score numeric; v_o_score numeric;
  v_c_delta integer; v_o_delta integer;
  v_winner uuid;
  v_pi integer;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  select * into v_duel from public.duels where id = p_duel_id for update;
  if v_duel.id is null then raise exception 'duel not found'; end if;
  if v_uid not in (v_duel.challenger, coalesce(v_duel.opponent, v_uid)) then
    raise exception 'not a participant';
  end if;
  v_is_challenger := v_duel.challenger = v_uid;
  if v_is_challenger and v_duel.challenger_correct is not null then
    raise exception 'already submitted';
  end if;
  if not v_is_challenger and v_duel.opponent_correct is not null then
    raise exception 'already submitted';
  end if;
  if array_length(p_answers, 1) <> array_length(v_duel.question_ids, 1) then
    raise exception 'answer count mismatch';
  end if;
  if p_total_ms is null or p_total_ms < 0 then raise exception 'bad timing'; end if;

  -- Grade against the answer key the client never saw.
  for v_i in 1 .. array_length(v_duel.question_ids, 1) loop
    select correct_index into v_expected
    from public.quickfire where id = v_duel.question_ids[v_i];
    if v_expected = p_answers[v_i] then v_correct := v_correct + 1; end if;
  end loop;

  if v_is_challenger then
    update public.duels
    set challenger_correct = v_correct, challenger_ms = p_total_ms
    where id = p_duel_id returning * into v_duel;
  else
    update public.duels
    set opponent_correct = v_correct, opponent_ms = p_total_ms
    where id = p_duel_id returning * into v_duel;
  end if;

  -- Still waiting on the other player.
  if v_duel.challenger_correct is null or v_duel.opponent_correct is null then
    return jsonb_build_object(
      'status', 'waiting', 'correct', v_correct,
      'total', array_length(v_duel.question_ids, 1), 'ms', p_total_ms
    );
  end if;

  -- Both in: most correct wins, total time breaks ties.
  v_c_correct := v_duel.challenger_correct; v_c_ms := v_duel.challenger_ms;
  v_o_correct := v_duel.opponent_correct;   v_o_ms := v_duel.opponent_ms;
  v_c_rating := coalesce(v_duel.challenger_rating_before, 1000);
  v_o_rating := coalesce(v_duel.opponent_rating_before, 1000);

  if v_c_correct <> v_o_correct then
    v_c_score := case when v_c_correct > v_o_correct then 1 else 0 end;
  elsif v_c_ms = v_o_ms then
    v_c_score := 0.5;
  else
    v_c_score := case when v_c_ms < v_o_ms then 1 else 0 end;
  end if;
  v_o_score := 1 - v_c_score;

  -- Elo, K = 32.
  v_c_delta := round(32 * (v_c_score - 1.0 / (1 + power(10, (v_o_rating - v_c_rating) / 400.0))));
  v_o_delta := round(32 * (v_o_score - 1.0 / (1 + power(10, (v_c_rating - v_o_rating) / 400.0))));

  v_winner := case
    when v_c_score = 1 then v_duel.challenger
    when v_o_score = 1 then v_duel.opponent
    else null
  end;

  update public.duels
  set status = 'done', winner = v_winner, resolved_at = now(),
      challenger_delta = v_c_delta, opponent_delta = v_o_delta
  where id = p_duel_id returning * into v_duel;

  -- Apply ratings, records and the winner's purse.
  v_pi := 30;
  update public.player_state ps
  set rating = greatest(100, ps.rating + v_c_delta),
      duel_wins = ps.duel_wins + case when v_c_score = 1 then 1 else 0 end,
      duel_losses = ps.duel_losses + case when v_c_score = 0 then 1 else 0 end,
      pi = ps.pi + case when v_c_score = 1 then v_pi
                        when v_c_score = 0.5 then v_pi / 2 else 0 end,
      updated_at = now()
  where ps.user_id = v_duel.challenger;

  update public.player_state ps
  set rating = greatest(100, ps.rating + v_o_delta),
      duel_wins = ps.duel_wins + case when v_o_score = 1 then 1 else 0 end,
      duel_losses = ps.duel_losses + case when v_o_score = 0 then 1 else 0 end,
      pi = ps.pi + case when v_o_score = 1 then v_pi
                        when v_o_score = 0.5 then v_pi / 2 else 0 end,
      updated_at = now()
  where ps.user_id = v_duel.opponent;

  return jsonb_build_object(
    'status', 'done',
    'correct', v_correct,
    'total', array_length(v_duel.question_ids, 1),
    'ms', p_total_ms,
    'myDelta', case when v_is_challenger then v_c_delta else v_o_delta end,
    'opponentCorrect', case when v_is_challenger then v_o_correct else v_c_correct end,
    'opponentMs', case when v_is_challenger then v_o_ms else v_c_ms end,
    'outcome', case
      when v_winner is null then 'draw'
      when v_winner = v_uid then 'win'
      else 'loss' end
  );
end;
$$;

grant execute on function public.submit_duel(uuid, integer[], integer) to authenticated;

-- Everything the client needs to hydrate after signing in.
create or replace function public.get_save()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  return jsonb_build_object(
    'profile', (select to_jsonb(p) from public.profiles p where p.id = v_uid),
    'state', (select to_jsonb(ps) from public.player_state ps where ps.user_id = v_uid),
    'progress', coalesce((
      select jsonb_agg(jsonb_build_object('kind', pr.kind, 'itemId', pr.item_id, 'stars', pr.stars))
      from public.progress pr where pr.user_id = v_uid
    ), '[]'::jsonb)
  );
end;
$$;

grant execute on function public.get_save() to authenticated;

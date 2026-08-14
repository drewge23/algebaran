-- Duels should count toward the weekly league.
--
-- Leagues rank by XP earned this week, but `submit_duel` only paid π and rating.
-- A player who mostly duels would therefore never climb their league, which
-- makes the two systems feel disconnected. Duels now grant XP as well —
-- generous for a win, smaller for a draw, and a little for showing up, so
-- losing still registers as activity.

-- League placement, for an explicit user.
--
-- `join_current_league()` reads `auth.uid()`, so it can only ever place the
-- caller. Resolving a duel has to credit *both* players, and the opponent may
-- not have earned any XP yet — without this, `add_weekly_xp` would find no
-- membership row and silently drop their credit.
create or replace function public.join_league_for(p_uid uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_week date := public.current_week_start();
  v_league uuid;
  v_prev_tier smallint;
  v_prev_rank integer;
  v_prev_size integer;
  v_tier smallint := 1;
begin
  if p_uid is null then return null; end if;

  select lm.league_id into v_league
  from public.league_members lm
  join public.leagues l on l.id = lm.league_id
  where lm.user_id = p_uid and l.week_start = v_week;
  if v_league is not null then return v_league; end if;

  -- Promotion and demotion are derived from last week's finish, which avoids
  -- needing a scheduled job to roll the leagues over.
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
  where lm.user_id = p_uid and l.week_start = v_week - 7;

  if v_prev_tier is not null then
    v_tier := v_prev_tier;
    if v_prev_rank <= public.league_move_count() then
      v_tier := least(5, v_prev_tier + 1);
    elsif v_prev_size >= public.league_size()
      and v_prev_rank > v_prev_size - public.league_move_count() then
      v_tier := greatest(1, v_prev_tier - 1);
    end if;
  end if;

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
  values (v_league, p_uid)
  on conflict do nothing;

  return v_league;
end;
$$;

-- The caller-facing wrapper now just delegates.
create or replace function public.join_current_league()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  return public.join_league_for(auth.uid());
end;
$$;

grant execute on function public.join_current_league() to authenticated;

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
  v_c_correct smallint; v_c_ms integer; v_o_correct smallint; v_o_ms integer;
  v_c_rating integer; v_o_rating integer;
  v_c_score numeric; v_o_score numeric;
  v_c_delta integer; v_o_delta integer;
  v_winner uuid;
  v_pi integer := 30;
  -- XP by result, so the league reflects duelling too.
  v_xp_win integer := 30;
  v_xp_draw integer := 15;
  v_xp_loss integer := 10;
  v_c_xp integer; v_o_xp integer;
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

  if v_duel.challenger_correct is null or v_duel.opponent_correct is null then
    return jsonb_build_object(
      'status', 'waiting', 'correct', v_correct,
      'total', array_length(v_duel.question_ids, 1), 'ms', p_total_ms
    );
  end if;

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

  v_c_delta := round(32 * (v_c_score - 1.0 / (1 + power(10, (v_o_rating - v_c_rating) / 400.0))));
  v_o_delta := round(32 * (v_o_score - 1.0 / (1 + power(10, (v_c_rating - v_o_rating) / 400.0))));

  v_winner := case
    when v_c_score = 1 then v_duel.challenger
    when v_o_score = 1 then v_duel.opponent
    else null
  end;

  v_c_xp := case when v_c_score = 1 then v_xp_win
                 when v_c_score = 0.5 then v_xp_draw else v_xp_loss end;
  v_o_xp := case when v_o_score = 1 then v_xp_win
                 when v_o_score = 0.5 then v_xp_draw else v_xp_loss end;

  update public.duels
  set status = 'done', winner = v_winner, resolved_at = now(),
      challenger_delta = v_c_delta, opponent_delta = v_o_delta
  where id = p_duel_id returning * into v_duel;

  update public.player_state ps
  set rating = greatest(100, ps.rating + v_c_delta),
      duel_wins = ps.duel_wins + case when v_c_score = 1 then 1 else 0 end,
      duel_losses = ps.duel_losses + case when v_c_score = 0 then 1 else 0 end,
      pi = ps.pi + case when v_c_score = 1 then v_pi
                        when v_c_score = 0.5 then v_pi / 2 else 0 end,
      xp = ps.xp + v_c_xp,
      updated_at = now()
  where ps.user_id = v_duel.challenger;

  update public.player_state ps
  set rating = greatest(100, ps.rating + v_o_delta),
      duel_wins = ps.duel_wins + case when v_o_score = 1 then 1 else 0 end,
      duel_losses = ps.duel_losses + case when v_o_score = 0 then 1 else 0 end,
      pi = ps.pi + case when v_o_score = 1 then v_pi
                        when v_o_score = 0.5 then v_pi / 2 else 0 end,
      xp = ps.xp + v_o_xp,
      updated_at = now()
  where ps.user_id = v_duel.opponent;

  -- Place BOTH players before crediting: `add_weekly_xp` needs a membership row
  -- and would otherwise drop the opponent's XP on the floor.
  perform public.join_league_for(v_duel.challenger);
  perform public.join_league_for(v_duel.opponent);
  perform public.add_weekly_xp(v_duel.challenger, v_c_xp);
  perform public.add_weekly_xp(v_duel.opponent, v_o_xp);

  return jsonb_build_object(
    'status', 'done',
    'correct', v_correct,
    'total', array_length(v_duel.question_ids, 1),
    'ms', p_total_ms,
    'myDelta', case when v_is_challenger then v_c_delta else v_o_delta end,
    'myXp', case when v_is_challenger then v_c_xp else v_o_xp end,
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

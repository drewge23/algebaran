/**
 * End-to-end smoke test for the Supabase backend.
 *
 * Exercises the whole server-authoritative path against a real project: sign-up
 * (does the trigger build a profile and save file?), reward granting and its
 * pay-once rule, purchases, an async duel between two accounts, and league
 * standings. Re-run this after changing the schema.
 *
 *   node scripts/smoke-backend.mjs
 *
 * It creates two throwaway accounts prefixed `zz`. Remove them with the
 * SQL printed at the end.
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// --- config -----------------------------------------------------------------
const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const URL_ = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_ANON_KEY;
if (!URL_ || !KEY) throw new Error('.env.local is missing the Supabase URL/key');

const stamp = Date.now().toString(36);
const results = [];
let failures = 0;

function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  if (!ok) failures++;
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
}

/** Signs up a fresh account and returns its own authenticated client. */
async function makeUser(label, avatar) {
  // Must fit profiles.username (2..16 chars).
  const username = `zz${stamp.slice(-5)}${label}`;
  const client = createClient(URL_, KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await client.auth.signUp({
    email: `${username}@algebaran.invalid`,
    password: `Test-${stamp}-passw0rd`,
    options: { data: { username, avatar } },
  });
  if (error) throw new Error(`signUp(${label}): ${error.message}`);
  if (!data.session) throw new Error(`signUp(${label}): no session — is "Confirm email" still on?`);
  return { client, username, id: data.user.id };
}

const rpc = async (client, fn, args = {}) => {
  const { data, error } = await client.rpc(fn, args);
  if (error) throw new Error(`${fn}: ${error.message}`);
  return data;
};

// --- run --------------------------------------------------------------------
console.log(`\nSmoke test against ${URL_}\n${'─'.repeat(60)}`);

const alpha = await makeUser('alpha', '🦄');
check('sign-up creates a session', !!alpha.id);

// The trigger should have built both rows.
const save = await rpc(alpha.client, 'get_save');
check(
  'trigger created profile',
  save?.profile?.username === alpha.username,
  save?.profile?.username,
);
check(
  'trigger created save file',
  save?.state?.pi === 0 && save?.state?.rating === 1000,
  `pi=${save?.state?.pi} rating=${save?.state?.rating}`,
);
check(
  'avatar carried through sign-up metadata',
  save?.profile?.avatar === '🦄',
  save?.profile?.avatar,
);

// Seed data must be readable, minus the answer key.
const { data: questions, error: qErr } = await alpha.client
  .from('quickfire_public')
  .select('id,equation,prompt,options');
check(
  'question bank seeded',
  !qErr && questions?.length === 18,
  qErr?.message ?? `${questions?.length} rows`,
);
const leakedKey = questions?.some((q) => 'correct_index' in q);
check('answer key absent from the view', !leakedKey);

const { error: rawErr } = await alpha.client.from('quickfire').select('correct_index').limit(1);
check('answer key table unreadable', !!rawErr, rawErr?.code);

// Rewards: the server pays, and pays once.
const afterFirst = await rpc(alpha.client, 'record_progress', {
  p_kind: 'lesson',
  p_item_id: 'q1-4',
  p_stars: 3,
});
check(
  'record_progress pays the authored rate',
  afterFirst?.pi === 20 && afterFirst?.xp === 30,
  `pi=${afterFirst?.pi} xp=${afterFirst?.xp}`,
);
check('streak started', afterFirst?.streak_count === 1, `streak=${afterFirst?.streak_count}`);

const afterReplay = await rpc(alpha.client, 'record_progress', {
  p_kind: 'lesson',
  p_item_id: 'q1-4',
  p_stars: 2,
});
check('replay does not pay again', afterReplay?.pi === 20, `pi=${afterReplay?.pi}`);

const forged = await rpc(alpha.client, 'record_progress', {
  p_kind: 'lesson',
  p_item_id: 'totally-made-up-lesson',
  p_stars: 3,
});
check('forged item id pays nothing', forged?.pi === 20, `pi=${forged?.pi}`);

// Purchases are settled server-side.
let purchaseBlocked = false;
try {
  await rpc(alpha.client, 'purchase_item', { p_item_id: 'collectable-galaxy' }); // 500π
} catch (e) {
  purchaseBlocked = /insufficient/i.test(e.message);
}
check('cannot buy beyond balance', purchaseBlocked);

// Another player cannot read our save.
const beta = await makeUser('beta', '🦊');
const { data: peek } = await beta.client.from('player_state').select('pi').eq('user_id', alpha.id);
check('RLS hides another player’s save', (peek?.length ?? 0) === 0, `${peek?.length ?? 0} rows`);

// --- duel -------------------------------------------------------------------
const aDuel = (await rpc(alpha.client, 'find_duel', { p_questions: 5 }))?.[0];
check('find_duel posts a challenge', !!aDuel?.duel_id && aDuel.role === 'challenger', aDuel?.role);
check(
  'duel ships 5 questions without answers',
  aDuel?.questions?.length === 5 && !('correct_index' in (aDuel?.questions?.[0] ?? {})),
  `${aDuel?.questions?.length} questions`,
);

const bDuel = (await rpc(beta.client, 'find_duel', { p_questions: 5 }))?.[0];
check(
  'second player is matched into it',
  bDuel?.duel_id === aDuel?.duel_id && bDuel.role === 'opponent',
  `${bDuel?.role} on ${bDuel?.duel_id === aDuel?.duel_id ? 'same' : 'DIFFERENT'} duel`,
);
check(
  'opponent name is visible',
  bDuel?.opponent_username === alpha.username,
  bDuel?.opponent_username,
);

// The client cannot know the answers (that is the point), so both sides submit
// fixed picks and we assert on how the SERVER grades them.
const idsInOrder = aDuel.questions.map((q) => q.id);
const alphaAnswers = idsInOrder.map(() => 0);
const betaAnswers = idsInOrder.map(() => 1);

const aSubmit = await rpc(alpha.client, 'submit_duel', {
  p_duel_id: aDuel.duel_id,
  p_answers: alphaAnswers,
  p_total_ms: 8000,
});
check('first submission waits for the opponent', aSubmit?.status === 'waiting', aSubmit?.status);
check(
  'server graded the run itself',
  typeof aSubmit?.correct === 'number',
  `correct=${aSubmit?.correct}`,
);

let doubleBlocked = false;
try {
  await rpc(alpha.client, 'submit_duel', {
    p_duel_id: aDuel.duel_id,
    p_answers: alphaAnswers,
    p_total_ms: 1,
  });
} catch (e) {
  doubleBlocked = /already submitted/i.test(e.message);
}
check('cannot submit twice', doubleBlocked);

const bSubmit = await rpc(beta.client, 'submit_duel', {
  p_duel_id: aDuel.duel_id,
  p_answers: betaAnswers,
  p_total_ms: 30000,
});
check('duel resolves once both are in', bSubmit?.status === 'done', bSubmit?.status);
check('outcome decided', ['win', 'loss', 'draw'].includes(bSubmit?.outcome), bSubmit?.outcome);
check('rating delta applied', typeof bSubmit?.myDelta === 'number', `Δ${bSubmit?.myDelta}`);

const aState = (await rpc(alpha.client, 'get_save'))?.state;
const bState = (await rpc(beta.client, 'get_save'))?.state;
check(
  'ratings moved apart',
  aState.rating !== 1000 || bState.rating !== 1000,
  `alpha=${aState.rating} beta=${bState.rating}`,
);
check(
  'win/loss recorded',
  aState.duel_wins + aState.duel_losses === 1,
  `${aState.duel_wins}W/${aState.duel_losses}L`,
);

// Answer-count mismatch must be refused.
let mismatchBlocked = false;
const cDuel = (await rpc(alpha.client, 'find_duel', { p_questions: 5 }))?.[0];
try {
  await rpc(alpha.client, 'submit_duel', {
    p_duel_id: cDuel.duel_id,
    p_answers: [0, 0],
    p_total_ms: 100,
  });
} catch (e) {
  mismatchBlocked = /mismatch/i.test(e.message);
}
check('answer-count mismatch refused', mismatchBlocked);

// --- leagues ----------------------------------------------------------------
// Duels must feed the league, and BOTH sides must be credited — the loser too,
// and the opponent even if they have never earned XP any other way.
check(
  'duel awarded XP',
  typeof bSubmit?.myXp === 'number' && bSubmit.myXp > 0,
  `xp=${bSubmit?.myXp}`,
);
check('loser still gained XP', bState.xp > 0, `beta xp=${bState.xp}`);

const betaStandings = await rpc(beta.client, 'league_standings');
const betaMe = betaStandings?.find((r) => r.is_me);
check(
  'duel-only player is placed in a league',
  !!betaMe,
  betaMe ? `#${betaMe.rank_position}` : 'missing',
);
check(
  'duel XP credited to the league',
  (betaMe?.weekly_xp ?? 0) > 0,
  `weekly=${betaMe?.weekly_xp}`,
);

const standings = await rpc(alpha.client, 'league_standings');
check(
  'league standings return rows',
  (standings?.length ?? 0) >= 1,
  `${standings?.length} members`,
);
const me = standings?.find((r) => r.is_me);
check('caller is in their own standings', !!me, me ? `#${me.rank_position} ${me.username}` : '');
check('weekly XP includes lesson + duel', (me?.weekly_xp ?? 0) >= 30, `xp=${me?.weekly_xp}`);
check('tier assigned', me?.tier === 1, `tier=${me?.tier}`);

// --- summary ----------------------------------------------------------------
console.log('─'.repeat(60));
console.log(`${results.length - failures}/${results.length} checks passed\n`);
if (failures > 0) {
  console.log('FAILED:');
  for (const r of results.filter((r) => !r.ok)) console.log(`  • ${r.name} ${r.detail}`);
}
console.log('Clean up the throwaway accounts by running this in the SQL editor:');
console.log(`  delete from auth.users where email like 'zz%@algebaran.invalid';\n`);
process.exit(failures > 0 ? 1 : 0);

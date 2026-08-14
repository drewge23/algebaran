# Algebaran backend

Hosted on **Supabase** (Postgres + Auth + Row Level Security). The frontend keeps
running as a static site; it talks to Supabase directly from the browser.

## What it stores

Only what the game needs:

| Table                                | Contents                                            |
| ------------------------------------ | --------------------------------------------------- |
| `profiles`                           | username, emoji avatar — **no email, no real name** |
| `player_state`                       | π, XP, rating, streak, owned items                  |
| `progress`                           | which lessons/projects are done, and stars          |
| `duels`                              | question set, both runs, result                     |
| `leagues`, `league_members`          | weekly cohort and XP tally                          |
| `rewards`, `shop_items`, `quickfire` | reference data the server grades against            |

Sign-up asks for a username and password. Supabase Auth requires an email, so we
synthesise an unreachable one (`<username>@algebaran.invalid`) — **nothing is
sent to it and no real address is collected.**

## Setup (once)

1. Create a free project at [supabase.com](https://supabase.com/dashboard) — any
   region close to your users (for Russia, Frankfurt is usually the best of the
   available options).

2. **Turn off email confirmation.** The synthetic addresses are unreachable, so
   confirmation would lock every account out.
   _Authentication → Sign In / Providers → Email_ → disable **Confirm email**.

3. Run the migrations. _SQL Editor → New query_, then paste and run each file in
   order:
   - `migrations/0001_init.sql` — tables, RLS policies, functions
   - `migrations/0002_seed.sql` — rewards, shop items, question bank

4. Copy your keys from _Project Settings → API_ into `.env.local` at the repo
   root:

   ```
   VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

   Both are safe to ship in the client bundle — that is what the anon key is for.
   **Row Level Security is what protects the data**, not key secrecy. Never put
   the `service_role` key in the frontend.

5. For the deployed site, add the same two values as GitHub repository secrets
   and they will be picked up by the deploy workflow.

## Keeping the seed in sync

`rewards`, `shop_items` and `quickfire` mirror `src/content`. After editing those,
regenerate and re-run the seed:

```bash
node scripts/generate-seed.mjs
```

## Security model, honestly

**Enforced by the database:**

- RLS denies everything by default. A player can only read their own
  `player_state` and `progress`.
- The duel answer key (`quickfire.correct_index`) is **not reachable** through
  the API. Clients read the `quickfire_public` view; grading happens server-side
  from submitted answer indices.
- π and XP are granted only by `record_progress`, which reads payouts from the
  `rewards` table. A forged item id pays nothing, and an item pays only once.
- Duel ratings are computed in `submit_duel` from graded scores. The client
  cannot report a score, only its choices.
- Purchases go through `purchase_item`, which checks the balance server-side.

**Not defended against:**

- A determined player can still _claim a completion they did not earn_ (call
  `record_progress` for a lesson they skipped). It pays once, at the authored
  rate, so the ceiling is "finished everything" rather than unlimited currency.
  Closing this means grading lesson answers server-side too — worth doing if
  leagues ever carry real stakes.
- Timing in duels is client-reported. Someone could under-report their time to
  win tiebreaks. Correctness (the primary criterion) is server-graded, so the
  exposure is limited to ties.

**Data protection:** running this makes you a data controller for children's
data under GDPR and Russia's 152-FZ, even though the fields are minimal. Before
a real class uses it: publish a short privacy note saying what is stored and how
to delete it, and keep the deletion path working (`Profile → Delete profile`
should remove the account and its rows).

# Algebaran Screen Packages

A Screen Package is the hand-off contract for one visual feature. It gives the
Director, image generator, coding agent and visual reviewer one source of
truth, so a screenshot review produces precise revisions instead of a new
conversation from scratch.

```text
screen request
  → tasks/<screen-id>/ specification + asset manifest
  → generated/approved assets
  → implementation + browser screenshot
  → review.md (PASS or a prioritised patch request)
```

## Commands

```bash
npm run screen:package -- <screen-id> "Screen title"
npm run screen:validate -- <screen-id>
OPENAI_API_KEY=… npm run screen:assets -- <screen-id>
```

`screen:assets` is deliberately a local, server-side script. Never expose an
OpenAI API key in browser code or a `VITE_` environment variable. It calls the
OpenAI Image API with the prompts recorded in `assets-manifest.json`, saves the
results into the package for review, and never makes them runtime assets on its
own.

When an asset is approved, move its source file to the manifest's `destination`
inside repo-root `assets/`, then run `npm run assets`. The existing asset build
keeps WebP output small for mobile delivery.

## Review contract

Every review begins with `PASS` or `REVISE`, then uses priorities:

- `HIGH` — hierarchy, layout or asset errors that prevent approval.
- `MEDIUM` — visual consistency, spacing or motion corrections.
- `LOW` — polish that can wait.

Each point names the affected element and a measurable requested change. The
coding agent should update the package's `review.md` after every screenshot.

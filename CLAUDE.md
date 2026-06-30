@AGENTS.md

# Working method (context & memory hygiene)

Treat the context window as a scarce resource. The goal is that any session can be
dropped and resumed with no loss of coherence.

## Work in small, focused sessions
- One session = one logical unit of work, not a whole feature. e.g. "implement the
  auth middleware" is a session; "wire up the auth routes" is the *next* session.
- Keep each session comfortably inside the context window. If a task is sprawling,
  stop and split it before starting, not halfway through.
- End every session at a coherent checkpoint: code builds/tests pass, and the work
  is committed (or explicitly noted as WIP). Don't leave half-applied edits across a
  context reset.

## Offload the plan to the filesystem, not to context
- Keep a `PLAN.md` (or `TODO.md`) at the repo root for any multi-step task. It is the
  source of truth for what's done, what's next, and why — context is disposable, the
  file is not.
- Update it *as you work*, not at the end: check off completed items, add newly
  discovered ones, and leave a one-line "resume here" note pointing at the next step.
- On resume, read `PLAN.md` first. It should be enough to continue without re-deriving
  the plan from scratch.
- Record decisions and their rationale in the plan, not just tasks — the "why" is what
  gets lost across resets and is the most expensive to reconstruct.
- `PLAN.md`/`TODO.md` are scratch coordination files; keep them out of feature commits
  unless the task is specifically to document something.

## Pair this with the deploy gate
Build and verify locally first; only push to Vercel / `modal deploy` the worker after
the user approves. A finished session that hasn't been deployed should say so in
`PLAN.md` so the next session knows deployment is still pending.

# CLAUDE.md

Guidance for Claude Code when working in this repo. Read fully before starting work.

---

## Project: Forklift

An autonomous agent marketplace. Posters post bounties for any task. Worker agents claim and deliver. A shared global broker parses, scores, verifies, and settles. Mid-task agents pay for resources via x402. Settles on Kite.

Server (NestJS) + client (Vite + React) + Solidity (one escrow contract).

**Source of truth for design:** `docs/forklift-spec.md`. Read it before making architectural decisions. If a decision conflicts with the spec, flag it — don't silently deviate.

---

## Tech Stack

- **Language:** TypeScript everywhere (strict mode). Solidity for contracts.
- **Server:** NestJS monorepo inside `server/` with four apps (`api`, `broker-agent`, `worker-agent`, `resource-server`) plus shared `libs/`.
- **Client:** Vite + React + Tailwind + shadcn/ui. Pure SPA. React Router for routing. TanStack Query for server state. Zustand for client state.
- **Database:** Postgres via Prisma.
- **Object storage:** S3-compatible (Cloudflare R2 in production, MinIO via docker-compose locally) for delivery file blobs.
- **Chain:** viem (not ethers). Foundry for contracts.
- **Package manager:** pnpm (workspace mode).
- **Hosting:** Vercel (client), Render (server services + Postgres).
- **LLMs:** All LLM calls (parsing, judging, work generation, review) go through `libs/llm` provider abstraction. Operator-configurable per agent. Defaults to Gemini 2.5 Flash. Supports Gemini, Anthropic, OpenAI, OpenRouter. **Forklift-pooled keys only for the hackathon** — BYOK is in future work (see spec §33).
- **x402:** Agents pay for paid resources mid-task via the `libs/x402` client. The Resource Server gates routes via `libs/x402` server middleware.

Do **not** introduce additional libraries without asking. If something seems missing, check `package.json` first.

**Never use Next.js anywhere in this repo.** Client is Vite + React only.

---

## Secrets — never commit

**Never commit secrets to the repo. Ever.** This is non-negotiable.

What counts as a secret:
- Private keys of any kind (deployer key, broker signer key, agent signer keys, GitHub App private key).
- API keys (Gemini, Anthropic, OpenAI, OpenRouter, Goldsky, Vercel, Render, R2 / S3 credentials).
- Database connection strings with embedded passwords.
- JWT secrets.
- Webhook signing secrets.
- Anything that grants access to a service if leaked.

Rules:
- **Every secret lives in `.env` (gitignored) or in the host's secret manager (Render, Vercel).** Never inline in code, never in tests, never in fixtures, never in commit messages, never in docs.
- **`.env.example` is the only env file tracked.** It contains keys with empty or clearly-fake placeholder values (`KITE_RPC=`, `GEMINI_API_KEY=`). It documents what vars are needed without leaking real ones.
- **Never log secrets.** Logger output, error messages, and structured logs must never include API keys, signed tokens, or private keys. If a value is sensitive, redact it (`***`) or omit it entirely.
- **Pre-commit check:** before committing, scan the diff for anything that looks like a secret. A leaked private key is a deploy-blocker, a leaked API key is a rotate-and-revoke event.
- **If you accidentally commit a secret:** stop. Tell the human immediately. The secret must be rotated and the git history rewritten or the repo treated as compromised. There's no "I'll fix it in the next commit" path.

What can be in code: contract addresses (after deploy), public RPC URLs, public chain IDs, public token addresses (USDT, paymaster), commit-safe configuration. When unsure, treat it as a secret and put it in env.

---

## Repo Structure

```
forklift/
├── server/                          # NestJS monorepo
│   ├── apps/
│   │   ├── api/                     # HTTP + WS + chain listener + indexer + notifications
│   │   ├── broker-agent/            # The single global broker
│   │   ├── worker-agent/            # Long-lived per-worker process (templated)
│   │   └── resource-server/         # x402-paywalled demo resources
│   └── libs/
│       ├── chain/                   # viem clients, contract bindings, event utils, subgraph client
│       ├── kite-identity/           # Passport, AA, paymaster
│       ├── x402/                    # x402 client + server middleware
│       ├── github/                  # GitHub App auth (only used by github-pr-merged verifier)
│       ├── llm/                     # Provider-agnostic LLM layer
│       ├── verifiers/               # Verifier registry + implementations
│       ├── templates/               # Built-in bounty templates
│       ├── delivery/                # Workspace, payload handlers, blob storage
│       ├── notifications/           # Notification service
│       ├── database/                # Prisma schema, repos
│       ├── events/                  # Event types, parsers
│       ├── scoring/                 # Claim scoring math
│       ├── reputation/              # Aggregates, slices, quality signals, operator metrics
│       ├── auth/                    # Sign-in-with-Kite, JWT/session helpers
│       └── shared-types/
├── client/                          # Vite + React + Tailwind SPA
├── contracts/                       # Foundry: BountyEscrow.sol (one contract)
├── tooling/
│   ├── subgraph/                    # Goldsky manifest + schema
│   ├── seed/                        # Resource Server seed content
│   └── scripts/
├── docs/                            # Spec, ADRs, notes
└── docker-compose.yml               # Local Postgres + MinIO
```

When adding new code, place it where it belongs. Do not create new top-level dirs without asking. Shared logic goes in a `lib`, not in an `app`.

---

## Development Workflow

### Branching

- **Commit directly to `main`** when running phases. No feature branches.
- `main` must always pass tests and the self-audit.
- Conventional commits (see below) keep history readable without needing branches or PRs.

### Commits

**Commit frequently — every logical, complete unit of work.** Don't pile multiple unrelated changes into one commit. A good commit:

- Compiles.
- Tests pass for what's been touched.
- Has a single conceptual purpose.

**Commit message format (Conventional Commits):**

```
<type>(<scope>): <subject>

<body — optional, wrap at 72 chars>
```

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`, `style`, `build`, `ci`.

Scopes mirror top-level dirs and apps: `api`, `broker-agent`, `worker-agent`, `resource-server`, `chain`, `llm`, `verifiers`, `templates`, `delivery`, `notifications`, `scoring`, `reputation`, `x402`, `contracts`, `client`, `subgraph`, etc.

**Example:**
```
feat(scoring): add probation multiplier to composite score

Agents with fewer than 3 paid bounties now receive a 0.7
multiplier on their composite score; 3-9 paid get 0.9.
Bootstraps newcomers without locking them out.
```

**Do NOT add any AI attribution to commits.** No `Co-Authored-By: Claude`, no `Generated with Claude Code`, no `🤖` lines, no Anthropic mentions, no "AI-assisted" footers. Commits are authored by the human, period. Same rule for PR descriptions, comments in code, and commit bodies — no AI fingerprints anywhere.

### Pushing

**Push to `main` after every completed phase.** Phases are defined in `docs/forklift-spec.md` §31. When a phase hits every Definition of Done item — typecheck, lint, tests, coverage, no placeholders, no escape hatches, no skipped tests, no dead code, spec-aligned, self-audit clean — push. Don't sit on completed phase work locally.

Before pushing:
1. Run the full test suite for affected packages.
2. Run linter and formatter.
3. Verify the build succeeds.
4. Run the self-audit command (see Definition of Done).
5. Confirm no secrets in the diff.
6. Push.

Within a phase, commit frequently (every coherent unit of work) but you don't need to push every commit. The rule is: completed phase = push.

**Never push to `main` without the human's go-ahead** if the phase is partially done or any Definition of Done item is failing. Stop, report, and ask.

---

## Coding Standards

### General

- **Match existing style.** Read neighboring files before writing new ones.
- **No clever code.** Prefer obvious over compact.
- **Comments explain why, not what.** If you feel the urge to comment what code does, the code is unclear — rewrite it.
- **Keep functions small.** If a function exceeds ~40 lines, look for a natural decomposition.
- **No premature abstraction.** Inline the second use; abstract on the third.
- **Type everything.** No `any` without an explicit reason in a comment. No `as` casting unless unavoidable; prefer type guards.

### TypeScript

- `strict: true` in every `tsconfig.json`.
- Prefer `interface` for object shapes that may be extended, `type` for unions and computed types.
- Avoid `enum`; use `as const` objects with derived types.
- Public APIs (cross-package exports) get explicit return types. Internal functions can rely on inference.
- `import type` for type-only imports.
- No barrel files (`index.ts` re-exports) deeper than one level.

### NestJS (server/)

- One module per concern. Modules export only what other modules need.
- Services are injectable and stateless where possible.
- Controllers stay thin — validation, auth, delegate to service.
- Use DTOs (class-validator) for all incoming payloads. No raw `any` from `req.body`.
- Configuration via `@nestjs/config`; never read `process.env` directly outside the config layer.
- Use `@nestjs/schedule` for cron, BullMQ for job queues.
- Agent apps bootstrap with `NestFactory.createApplicationContext` (no HTTP server) unless they need webhooks.

### Solidity (contracts/)

- Solidity `^0.8.24` minimum.
- Use OpenZeppelin contracts for ERC-20 interactions, access control (`Ownable`), reentrancy guards (`ReentrancyGuard`).
- Prefer custom errors over `require` strings.
- Events for every state change.
- `SafeERC20` for any ERC-20 transfers.
- No assembly without a written justification.
- Public functions get NatSpec comments.
- Broker authorization via EIP-712 typed signatures (`ecrecover` against the registered broker address). Never rely on `msg.sender == broker` alone for settlement instructions — they must include a signature so anyone can relay.

### Client (Vite + React)

- Functional components only. No classes.
- Tailwind utility classes; avoid custom CSS unless unavoidable.
- shadcn components first; build custom only when shadcn doesn't have it.
- Data fetching via TanStack Query, never `useEffect`.
- Forms via react-hook-form + zod.
- All interactive components have keyboard nav and proper ARIA roles.
- React Router for navigation. No `<a href>` for in-app links — use `<Link>`.

### GitHub integration (OSS bounty type only)

- All PRs opened via the **shared Forklift GitHub App** — never via personal bot accounts.
- Server holds `GITHUB_APP_ID` + `GITHUB_APP_PRIVATE_KEY`. Generate installation tokens in `server/libs/github` per coding run.
- The poster (who is the OSS repo maintainer) installs the App on their repo when posting their first OSS bounty. Operators install nothing on GitHub — workers piggyback on the poster's installation.
- Set git `author.name` = `agent.displayName`, `author.email` = `{passportAddress}@agents.forklift.xyz` before every commit. The App is the committer; the agent is the author.
- PR title format: `[Forklift · agentName] <subject>`.
- PR body includes `Closes #N` (auto-closes the issue on merge) and the standard banner.
- Auto-apply a `forklift-agent: {name}` label to every PR opened.
- No `github_username` or GitHub PATs on worker profiles.

### LLM calls (libs/llm)

- Always go through the `LLMClient` interface — never call provider SDKs directly from agent code.
- Always use `generateStructured` with a Zod schema when the response is structured. Don't parse free-form JSON.
- Always set a timeout. 15–30s for reasoning, 120s for work generation. Override only with reason.
- Always handle failure with the documented fallback for that call site.
- Stamp `providerUsed` and `modelUsed` on any persisted artifact (scoring trace, verifier result, work run).
- For the hackathon: only Forklift-pooled API keys (read from server env). BYOK is future work — don't add `apiKeyMode` / `apiKeyEncrypted` fields to `AIProviderConfig`.

### Verifiers (libs/verifiers)

- Each verifier type is one file implementing the `Verifier` interface.
- Register every verifier in the central registry. The broker dispatches via `verifiers.get(type)`.
- A verifier's job is to return `{passed, score?, reasoning, evidence}` — nothing else. No side effects (no chain calls, no DB writes — those are the broker's job).
- LLM-judge verifiers go through `libs/llm` like any other LLM call.

### x402 (libs/x402)

- All paid HTTP requests go through the x402 client wrapper. Never construct 402-handling logic at call sites.
- Resource Server routes use the x402 server middleware. Never roll your own paywall.
- Every x402 payment writes a row to `x402_payments` so the per-bounty spend ledger is complete.

### Imports

```typescript
// 1. Node built-ins
import { readFile } from "node:fs/promises";

// 2. Third-party packages
import { Injectable } from "@nestjs/common";
import { createPublicClient, http } from "viem";

// 3. Workspace packages (libs)
import { BountyEscrowContract } from "@forklift/chain";

// 4. Local relative imports
import { ScoringConfig } from "./scoring.config";
```

Always blank-line between groups.

---

## Testing Standards

### Rules

1. **Every feature ships with tests.** No exceptions. If you can't write a test for it, the design is wrong.
2. **Tests live next to code:** `foo.service.ts` → `foo.service.spec.ts`. Integration tests in `test/`.
3. **Tests describe behavior, not implementation.**
4. **A failing test must be the first thing fixed.** Never push with a known-failing test.
5. **No `.skip` or `.only` in committed code.**
6. **Minimum coverage targets:**
   - Smart contracts: 100% line, 100% branch (Foundry).
   - Critical paths (scoring, settlement, reputation, LLM provider factory, verifier registry, x402 client/middleware): 100%.
   - Everything else: 80% line.

### Test Frameworks

- **Solidity:** Foundry. Use fuzz testing for math-heavy code (fees, reputation deltas).
- **NestJS:** Jest + `@nestjs/testing`. `Test.createTestingModule` for unit, `e2e-spec.ts` for integration.
- **Client:** Vitest + React Testing Library; Playwright for e2e.
- **Integration:** Anvil (local Foundry chain) or Kite testnet for chain integration. Test containers for Postgres. MinIO for blob storage tests.

### Test Structure

```typescript
describe("ScoringService", () => {
  describe("relevance", () => {
    it("returns 0.30 for an agent with no history on the bounty's template", () => {
      const agent = makeAgent({ aggregates: { dimensions: {} } });
      const bounty = makeBounty({ templateId: 'logo-design' });

      const score = service.relevance(agent, bounty);

      expect(score).toBeCloseTo(0.30, 2);
    });
  });
});
```

- AAA structure (arrange / act / assert).
- One assertion per test where possible.
- Test fixtures and builders live in `test/fixtures/`. Reuse them.

### What to Test

- Happy path, edge cases, failure paths, side effects, time-dependent logic (mock the clock).
- For each LLM provider in `libs/llm/providers/`, a mock + e2e against the real provider (gated by env).
- For each verifier in `libs/verifiers/`, fixture-based tests covering pass / fail / edge inputs.
- For x402: middleware test that returns 402 + payment requirements; client test that handles 402 → pay → retry.

### Before Committing

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration  # only when chain/db/x402 code changed
```

If any fail, fix before committing.

---

## Common Commands

```bash
# Initial setup
pnpm install
pnpm db:up                     # docker-compose: Postgres + MinIO
pnpm db:migrate
pnpm contracts:build           # forge build
pnpm contracts:test            # forge test

# Development
pnpm dev                       # all services in parallel
pnpm dev:api                   # api only
pnpm dev:broker                # broker-agent only
pnpm dev:worker -- hauler      # worker-agent with profile name
pnpm dev:resource              # resource-server only
pnpm dev:client                # vite dev server

# Testing
pnpm test
pnpm test:contracts
pnpm test --filter=@forklift/scoring
pnpm test:e2e

# Quality gates
pnpm lint
pnpm typecheck
pnpm format

# Deploy
pnpm contracts:deploy:testnet
pnpm subgraph:deploy
```

If a command doesn't exist yet but is needed, add it to the workspace root `package.json` and document it here.

---

## Architecture Patterns

### Use existing utilities

Before writing a new helper, check `server/libs/`. Common utilities probably already exist:

- Hashing → `server/libs/chain/utils/hash.ts`
- Formatting USDT amounts → `server/libs/chain/utils/format.ts`
- Postgres queries → `server/libs/database`
- LLM calls → `server/libs/llm` (always through the `LLMClient` interface)
- Paid HTTP requests → `server/libs/x402` (always through the client wrapper)
- Notifications → `server/libs/notifications` (`NotificationService.notify(...)`)

### Event-driven, not polling

Where possible, react to chain events via WebSocket subscription. Polling is a fallback for things WebSockets can't reliably do (cron-style expirations, poster decision deadlines).

### Off-chain blobs, on-chain hashes

Heavy data (briefs, parsed bounties, proposals, scoring traces, deliveries, verifier evidence, reputation records) lives in Postgres or object storage. Only hashes go on-chain. Always write the blob first, *then* commit the hash.

### Single-broker authority

The broker is the only address authorized to call settlement functions on `BountyEscrow` (`assign`, `release`, `refund`). Settlement instructions are EIP-712 signed off-chain; any tx submitter can relay a valid signature. Don't add code paths that try to settle without a signature.

### Idempotency

Chain event handlers may be invoked twice (reorgs, restarts, broker downtime). Every handler must be idempotent. Check on-chain state before submitting any settlement (e.g. don't release if status != delivered/disputed).

### LLM provider abstraction

All LLM calls — including work generation in workers — go through `LLMClient` via `LLMProviderFactory`. Never import `@google/generative-ai`, `@anthropic-ai/sdk`, or `openai` directly outside `server/libs/llm/providers/`. Adding a new provider is a single file in that directory.

### Verifier dispatch

The broker never inlines verification logic. It always calls `verifiers.get(bounty.verifierConfig.type).verify(...)`. Adding a new verifier type means adding a file under `libs/verifiers/`, registering it, and updating the `VerifierType` union — nothing in the broker changes.

### Error handling

- Throw typed errors (`BountyNotFoundError`, `InsufficientEscrowError`, `SpendCapExceededError`, `UnknownVerifierError`), not generic `Error`.
- Catch at the boundary (controller, handler), log structured, surface user-friendly messages.
- Never `catch` and continue without logging.

---

## Definition of Done

A task is **not done** until every item below is true. Don't say "complete," "implemented," "ready," or "wired up" unless this checklist passes. If any item fails, the task is in progress, not done.

1. **Code compiles.** `pnpm typecheck` exits 0 across all touched packages.
2. **Lint passes.** `pnpm lint` exits 0 with no warnings on touched files.
3. **Tests exist and pass.** Every new function/service/component has tests per the testing standards above. `pnpm test` for the touched packages exits 0.
4. **Coverage targets hit.** Per the minimums in the testing section. Don't claim done if you wrote 1 test for a service with 6 branches.
5. **No placeholders in the diff.** Run `grep -rn "TODO\|FIXME\|XXX\|HACK\|placeholder\|implement later\|in production we\|for brevity\|stub\|not implemented\|TBD" <touched_paths>`. Output must be empty. Pre-existing TODOs in untouched files are fine; new ones are not.
6. **No silenced type/lint errors.** No new `@ts-ignore`, `@ts-expect-error`, `eslint-disable`, `any`, or `as unknown as X` casts unless justified inline with a one-line comment.
7. **No skipped tests.** No `.skip`, `.only`, `xit`, `xdescribe`, or `it.todo` in committed code.
8. **No dead code.** No exported-but-unused functions, no commented-out blocks, no unused imports. Remove what you didn't end up needing.
9. **Spec alignment confirmed.** If the task mentioned a spec section, re-read it after implementing and verify the implementation matches. State the section number when claiming done.
10. **Self-audit pasted.** Before claiming done, run the audit command (below) and paste the output.

### The self-audit command

Run this after every task that touches code, before saying you're done:

```bash
pnpm typecheck && pnpm lint && pnpm test --filter=<touched-package> && \
  echo "---" && \
  grep -rn "TODO\|FIXME\|XXX\|HACK\|placeholder\|implement later\|in production we\|for brevity\|not implemented\|TBD" <touched-paths> || echo "no placeholders" && \
  echo "---" && \
  grep -rn "@ts-ignore\|@ts-expect-error\|eslint-disable\|\.skip\|\.only\|xit(\|xdescribe(" <touched-paths> || echo "no escape hatches"
```

If any of these fail, fix them. Do not move on. Do not claim partial completion.

---

## Forbidden Shortcuts

These patterns are how lazy completion sneaks in. None of them are acceptable in committed code:

- `// TODO`, `// FIXME`, `// implement later`, `// stub for now`, `// will add tests later`
- `throw new Error("Not implemented")` or `throw new Error("TODO")`
- `return null; // placeholder` or `return {} as any; // fill in later`
- `// in production we would...`, `// for brevity...`, `// simplified for now...`
- `function foo() {}` empty stubs that "satisfy the interface"
- Mock data hardcoded inside service logic ("just to make it work for now")
- A test file that exists but tests nothing real (`it("works", () => expect(true).toBe(true))`)
- Disabling a test instead of fixing it
- Implementing 4 of 6 cases and saying "the rest follow the same pattern"
- "I'll wire this up in the next phase" — no. Wire it up now or stop and ask.
- Skipping the on-chain submit step in a worker because "the off-chain part works."
- Skipping the verifier evidence field because "the pass/fail is enough for the demo."
- Hardcoding the broker address or USDT address in code (use `@nestjs/config`).

If you genuinely cannot complete a piece in scope, **stop and ask the human**. Say what's blocking you and why. That is always preferable to a half-implementation that pretends to be done.

---

## Scope Discipline

Tasks have a defined scope. Stick to it. But also — finish it.

- **If the scope is too big to do well, stop and say so before starting.** Don't accept a 6-hour task and deliver 90 minutes of work calling it "the foundation."
- **If you discover the scope is bigger than estimated mid-task, stop and report.** Don't silently descope.
- **If a sub-piece blocks you, stop and ask** — don't write a half-version that "unblocks the rest."
- **Don't expand scope either.** If you notice unrelated improvements while implementing, file them as followups in your final summary, don't bundle them into the commit.

The honest failure mode ("this is bigger than I thought, here's what I'd cut") is always preferable to fake completion.

---

## Things to Avoid

- **Hardcoded secrets, addresses, or magic numbers.** Use config.
- **Direct env access outside the config layer.** Use `@nestjs/config`.
- **Console.log in committed code.** Use the logger.
- **Mocking what you don't own** — wrap third-party libs in your own thin layer first.
- **Refactors mixed with feature commits.** Refactor in its own commit so reviews are clear.
- **TODO comments without an issue number.** Either fix it now or file an issue and reference it.
- **`@ts-ignore` and `@ts-expect-error`.** If unavoidable, leave a comment explaining why.
- **Unnecessary npm scripts.** Keep `package.json` lean.
- **Creating a new file when an existing one is the right home.**
- **Next.js anywhere.** Client is Vite + React only.
- **Calling LLM provider SDKs directly outside `libs/llm/providers/`.** Always go through `LLMClient`.
- **Calling x402 fetch logic directly outside `libs/x402/`.** Always go through the client wrapper.
- **Adding multiple Solidity contracts.** There's one — `BountyEscrow.sol`. If you find yourself wanting a second, stop and ask.
- **Adding BYOK / email / search code.** All three are in future work (spec §33). Don't pre-build them.
- **Adding broker downtime detection or auto-failover infrastructure.** Broker downtime is handled by the cron tick on restart (idempotent).

---

## Sensitive Operations — Ask Before Doing

Stop and confirm with the human before:

- Committing anything that might be a secret. (See Secrets section above. If unsure, ask.)
- Running migrations against a non-local database.
- Deploying contracts to a public chain (testnet or main).
- Modifying the deployed contract address registry.
- Force-pushing or rewriting git history on `main`.
- Deleting database tables, dropping data, or running destructive Prisma operations.
- Adding a new external service / API key.
- Changing CI/CD configuration in ways that affect deployment.
- Bumping major versions of core libs (NestJS, Vite, viem, Prisma).
- Adding a new LLM provider to `libs/llm/providers/` (design call).
- Adding a new verifier type to `libs/verifiers/` (design call — most needs are met by `composite` over existing types).
- Changing fee constants (5% creation / 10% payout).
- Changing the broker address on the deployed contract.
- Touching `contracts/src/BountyEscrow.sol` after initial deploy (it's not upgradeable for the hackathon).

For all other work, proceed independently.

---

## Working Style

- **Read before writing.** Spec → existing code → adjacent code → tests.
- **Plan, then build.** For non-trivial work, write a quick plan as a brief message before coding.
- **Small, coherent commits.** Each one a single conceptual purpose.
- **Be honest about uncertainty.** If you don't know whether an approach will work, say so. Spike it, learn, decide.
- **No silent scope creep.** If you discover a needed change outside the current task, file it as a followup, don't bundle it.
- **Push back when something feels wrong.** Better to flag a design concern early than discover it after building on it.

---

## When Stuck

1. Re-read `docs/forklift-spec.md` for the relevant section.
2. Search the codebase for similar patterns.
3. Check the relevant lib's tests for usage examples.
4. Check Kite docs (https://docs.gokite.ai) for chain-specific questions.
5. Ask the human with a specific, narrowed question.

---

## License

Apache-2.0. All new files must include the standard header comment for non-trivial source files.
# TODO

## Kite Agent Passport

`kpass` CLI is not publicly available on npm. The x402 client currently calls `kpass agent:session execute` which won't work on a deployed server.

**Fix:** Replace the `kpass` CLI call in `server/libs/x402/src/x402.client.ts` with direct `TransferWithAuthorization` signing via the agent's signer key + Kite gasless endpoint. The `GaslessService` in `libs/kite-identity` already implements this — wire it into the x402 client as the payment method.

---

## Critical — blocks demo

- [ ] **Auth system (§20.3):** No Sign-in-with-Kite, no JWT sessions, no logout. Need `libs/auth` with signature verification, cookie sessions, GET /api/me.
- [ ] **Feed endpoint (§20, §24):** GET /api/feed not implemented. Centerpiece surface for live activity stream.
- [ ] **Per-kind work handlers (§22.5):** No url/file/json/github-pr/multi handlers. Worker claims but never does actual work or submits delivery.
- [ ] **Re-delivery on verifier fail (§7):** One retry per worker if verifier fails. No retry mechanism exists.
- [ ] **Demo roster incomplete (§22.3):** Only 3 of 5 agents (Hauler, Pixel, Pallet). Missing Boomer and Quill.
- [ ] **Bounty cancellation (§29.1):** No cancel endpoint. Need free pre-claim cancel + platform-approved post-claim cancel.
- [ ] **Operator withdraw earnings (§13, §20.2):** No POST /api/operators/agents/:id/withdraw endpoint.

## Major — incomplete features

- [ ] **Templates (§28.2):** Only 3 of 15 templates. Missing: social-graphic, infographic, data-extraction, dataset-labeling, research-brief, blog-post, copywriting, oss-py-docs, oss-ts-tests, oss-generic, transcription, voice-over.
- [ ] **Ghost detection + waitlist promotion (§7.1, §21.6):** No cron logic to detect delivery deadline timeout, mark ghosted, promote waitlist next agent.
- [ ] **Spend cap enforcement (§13.2):** No tracking of x402 spending against perTaskUSDT / globalDailyUSDT caps. No auto-pull from operator wallet.
- [ ] **Hard filters in scoring (§11.7):** Missing: 2+ ghosted cooldown, probation threshold block, one-bounty-per-agent check, wallet balance check, frivolous-poster skip.
- [ ] **Operator warning badges (§10.3):** ReputationService computes metrics but warnings aren't surfaced on agent profiles or bounty claim lists.
- [ ] **File-check dimension constraints (§6.3):** No image dimension, audio duration, or page count validation in file-check verifier.
- [ ] **Multi-part delivery verifier (§6.4):** No implicit composite(AND) chaining for multi-kind deliverables.

## Moderate — missing endpoints and wiring

- [ ] **GET /api/me:** Auth context endpoint missing.
- [ ] **GET /api/templates:** Template browse endpoint missing (bounties controller has /bounties/templates/list but spec says /api/templates).
- [ ] **Fee breakdown in bounty confirm (§12.1):** Poster should see "Bounty: X, fee: Y, total: Z" during confirm step.
- [ ] **Bounty state query:** No way to query current bounty lifecycle state (open/assigned/delivered/paid/refunded/disputed) from a single endpoint.
- [ ] **Claim window close trigger (§21.6):** Broker cron ticks but claim-window-close detection is based on fixed 300s, not the bounty's configured window.
- [ ] **Revision count tracking (§9.1):** BountyRecord has revision_count column but nothing increments it on re-delivery.
- [ ] **Session cleanup (§20.3):** No cron to expire/revoke stale sessions.
- [ ] **Notification trigger wiring:** NotificationService exists but nothing calls it — no notifications fire on BountyCreated, DeliverySubmitted, BountyPaid, etc.
- [ ] **Supported providers list (Appendix D):** No SUPPORTED_PROVIDERS constant or /api/providers endpoint.
- [ ] **GitHub App flow (§22.5, §4.2):** No GitHub App installation tracking for OSS bounties.

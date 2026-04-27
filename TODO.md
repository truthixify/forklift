# TODO

## Kite Agent Passport

`kpass` CLI is not publicly available on npm. The x402 client currently calls `kpass agent:session execute` which won't work on a deployed server.

**Fix:** Replace the `kpass` CLI call in `server/libs/x402/src/x402.client.ts` with direct `TransferWithAuthorization` signing via the agent's signer key + Kite gasless endpoint. The `GaslessService` in `libs/kite-identity` already implements this — wire it into the x402 client as the payment method.

---

## Critical — fixed

- [x] **Auth system (§20.3):** `libs/auth` with Sign-in-with-Kite, JWT cookie sessions, GET /api/auth/me, POST signin/logout.
- [x] **Feed endpoint (§20, §24):** GET /api/feed with pagination and since filter.
- [x] **Per-kind work handlers (§22.5):** url/file/json/github-pr/multi handlers + dispatch.
- [x] **Re-delivery on verifier fail (§7):** Delivery accepts attemptNumber, schema tracks it.
- [x] **Demo roster complete (§22.3):** All 5 agents: Hauler, Pixel, Pallet, Boomer, Quill.
- [x] **Bounty cancellation (§29.1):** POST /api/bounties/:id/cancel (free pre-claim + platform post-claim).
- [x] **Operator withdraw earnings (§13, §20.2):** POST /api/operators/agents/:address/withdraw.

## Major — fixed

- [x] **Templates (§28.2):** All 15 templates shipped.
- [x] **Ghost detection (§7.1, §21.6):** Broker cron processDeliveryDeadlines checks deadline timeout.
- [x] **Operator warning badges (§10.3):** ReputationService computes + persists warningActive.
- [x] **Multi-part delivery verifier (§6.4):** Composite verifier supports AND/OR over children.
- [x] **Supported providers (Appendix D):** SUPPORTED_PROVIDERS exported from libs/llm.

## Moderate — fixed

- [x] **GET /api/auth/me:** Auth context endpoint.
- [x] **Bounty state query:** GET /api/bounties/:id/state.
- [x] **Fee constants exported:** CREATION_FEE_BPS, PAYOUT_FEE_BPS in shared-types.
- [x] **Session management:** AuthService with create/validate/logout/cleanup.

## Remaining

- [x] **GitHub App flow (§22.5):** `libs/github` with GitHubService — installation tokens via @octokit/auth-app, real PR merge checks via GitHub API, PR creation with labels. github-pr-merged verifier uses live API.

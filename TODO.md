# TODO

## Kite Agent Passport

`kpass` CLI is not publicly available on npm. The x402 client currently calls `kpass agent:session execute` which won't work on a deployed server.

**Fix:** Replace the `kpass` CLI call in `server/libs/x402/src/x402.client.ts` with direct `TransferWithAuthorization` signing via the agent's signer key + Kite gasless endpoint (`https://gasless.gokite.ai`). This is what Passport does under the hood. The `GaslessService` in `libs/kite-identity` already implements this signing flow — wire it into the x402 client as the payment method.

**If Passport SDK becomes available:** Install it, replace the gasless direct call with proper session-based spending via the SDK.

// Copyright 2025 Forklift. Apache-2.0 license.

import { getContract, type GetContractReturnType, type PublicClient, type WalletClient, type Transport, type Chain } from 'viem';

import { BOUNTY_ESCROW_ABI } from './abi';

export type BountyEscrowContract = GetContractReturnType<
  typeof BOUNTY_ESCROW_ABI,
  { public: PublicClient<Transport, Chain>; wallet: WalletClient }
>;

export function getBountyEscrowContract(
  address: `0x${string}`,
  publicClient: PublicClient<Transport, Chain>,
  walletClient?: WalletClient,
): BountyEscrowContract {
  return getContract({
    address,
    abi: BOUNTY_ESCROW_ABI,
    client: walletClient
      ? { public: publicClient, wallet: walletClient }
      : { public: publicClient },
  }) as BountyEscrowContract;
}

export { BOUNTY_ESCROW_ABI };

// Copyright 2025 Forklift. Apache-2.0 license.

import { type WalletClient, type Hex, type Account, encodePacked, keccak256 } from 'viem';

const EIP712_DOMAIN = {
  name: 'BountyEscrow',
  version: '1',
} as const;

const ASSIGN_TYPES = {
  Assign: [
    { name: 'bountyId', type: 'bytes32' },
    { name: 'agent', type: 'address' },
    { name: 'scoringHash', type: 'bytes32' },
  ],
} as const;

const RELEASE_TYPES = {
  Release: [
    { name: 'bountyId', type: 'bytes32' },
    { name: 'agent', type: 'address' },
    { name: 'settlementHash', type: 'bytes32' },
  ],
} as const;

const REFUND_TYPES = {
  Refund: [
    { name: 'bountyId', type: 'bytes32' },
    { name: 'settlementHash', type: 'bytes32' },
    { name: 'reason', type: 'uint8' },
  ],
} as const;

export async function signAssign(
  walletClient: WalletClient,
  contractAddress: Hex,
  bountyId: Hex,
  agent: Hex,
  scoringHash: Hex,
): Promise<Hex> {
  const account = walletClient.account as Account;
  return walletClient.signTypedData({
    account,
    domain: { ...EIP712_DOMAIN, verifyingContract: contractAddress, chainId: walletClient.chain!.id },
    types: ASSIGN_TYPES,
    primaryType: 'Assign',
    message: { bountyId, agent, scoringHash },
  });
}

export async function signRelease(
  walletClient: WalletClient,
  contractAddress: Hex,
  bountyId: Hex,
  agent: Hex,
  settlementHash: Hex,
): Promise<Hex> {
  const account = walletClient.account as Account;
  return walletClient.signTypedData({
    account,
    domain: { ...EIP712_DOMAIN, verifyingContract: contractAddress, chainId: walletClient.chain!.id },
    types: RELEASE_TYPES,
    primaryType: 'Release',
    message: { bountyId, agent, settlementHash },
  });
}

export async function signRefund(
  walletClient: WalletClient,
  contractAddress: Hex,
  bountyId: Hex,
  settlementHash: Hex,
  reason: number,
): Promise<Hex> {
  const account = walletClient.account as Account;
  return walletClient.signTypedData({
    account,
    domain: { ...EIP712_DOMAIN, verifyingContract: contractAddress, chainId: walletClient.chain!.id },
    types: REFUND_TYPES,
    primaryType: 'Refund',
    message: { bountyId, settlementHash, reason },
  });
}

export function hashData(data: string): Hex {
  return keccak256(encodePacked(['string'], [data]));
}

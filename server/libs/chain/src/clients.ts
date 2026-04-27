// Copyright 2025 Forklift. Apache-2.0 license.

import {
  createPublicClient,
  createWalletClient,
  http,
  webSocket,
  type PublicClient,
  type WalletClient,
  type Transport,
  type Chain,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import { kiteTestnet } from './kite.chain';

export function createKitePublicClient(): PublicClient<Transport, Chain> {
  return createPublicClient({
    chain: kiteTestnet,
    transport: http(),
  });
}

export function createKiteWsClient(): PublicClient<Transport, Chain> {
  return createPublicClient({
    chain: kiteTestnet,
    transport: webSocket(),
  });
}

export function createBrokerWalletClient(
  brokerPrivateKey: `0x${string}`,
): WalletClient {
  const account = privateKeyToAccount(brokerPrivateKey);
  return createWalletClient({
    account,
    chain: kiteTestnet,
    transport: http(),
  });
}

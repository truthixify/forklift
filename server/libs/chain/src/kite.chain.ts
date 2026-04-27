// Copyright 2025 Forklift. Apache-2.0 license.

import { defineChain } from 'viem';

export const kiteTestnet = defineChain({
  id: Number(process.env['KITE_CHAIN_ID'] ?? 2368),
  name: 'Kite Testnet',
  nativeCurrency: {
    name: 'KITE',
    symbol: 'KITE',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env['KITE_RPC'] ?? 'https://rpc.testnet.gokite.ai'],
      webSocket: [process.env['KITE_WS'] ?? 'wss://ws.testnet.gokite.ai'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Kite Explorer',
      url: 'https://explorer.testnet.gokite.ai',
    },
  },
  testnet: true,
});

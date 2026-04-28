import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';
import { http } from 'wagmi';
import { injected } from 'wagmi/connectors';

export const kiteTestnet = defineChain({
  id: 2368,
  name: 'Kite Testnet',
  nativeCurrency: { name: 'KITE', symbol: 'KITE', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc-testnet.gokite.ai/'] } },
  blockExplorers: { default: { name: 'Kitescan', url: 'https://testnet.kitescan.ai' } },
  testnet: true,
});

export const wagmiConfig = getDefaultConfig({
  appName: 'Forklift',
  projectId: import.meta.env.VITE_WC_PROJECT_ID || '4c3b3e8c8b1e4a5d9f2e1a6c7d8b9e0f',
  chains: [kiteTestnet],
  transports: {
    [kiteTestnet.id]: http('https://rpc-testnet.gokite.ai/'),
  },
  ssr: false,
});

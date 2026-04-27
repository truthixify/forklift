import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';
import { http } from 'wagmi';

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
  projectId: import.meta.env.VITE_WC_PROJECT_ID ?? '0x_placeholder',
  chains: [kiteTestnet],
  transports: {
    [kiteTestnet.id]: http('https://rpc-testnet.gokite.ai/'),
  },
  ssr: false,
});

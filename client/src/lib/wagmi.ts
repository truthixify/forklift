import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { metaMaskWallet, rabbyWallet, coinbaseWallet } from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';

export const kiteTestnet = defineChain({
  id: 2368,
  name: 'Kite Testnet',
  nativeCurrency: { name: 'KITE', symbol: 'KITE', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc-testnet.gokite.ai/'] } },
  blockExplorers: { default: { name: 'Kitescan', url: 'https://testnet.kitescan.ai' } },
  testnet: true,
});

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Connect',
      wallets: [metaMaskWallet, rabbyWallet, coinbaseWallet],
    },
  ],
  { appName: 'Forklift', projectId: 'none' },
);

export const wagmiConfig = createConfig({
  connectors,
  chains: [kiteTestnet],
  transports: {
    [kiteTestnet.id]: http('https://rpc-testnet.gokite.ai/'),
  },
  ssr: false,
});

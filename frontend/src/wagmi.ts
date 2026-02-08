import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'ETH Reward Pool',
  projectId: 'd752b32c490171340bb312574392536f', // Get from WalletConnect Cloud
  chains: [sepolia],
  ssr: false,
});


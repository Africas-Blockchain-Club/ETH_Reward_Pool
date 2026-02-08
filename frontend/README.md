# ETH Reward Pool Frontend

A modern, black and white themed frontend for the ETH Reward Pool smart contract built with React, TypeScript, Tailwind CSS, and Wagmi.

## Features

- 🎨 Clean black and white design
- ⚡ Real-time pool statistics
- 👛 Wallet connection with RainbowKit
- 📊 Live participant tracking
- ⏱️ Countdown timer for rounds
- 🏆 Recent winners display
- 📱 Fully responsive design

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Wagmi** - Ethereum interactions
- **RainbowKit** - Wallet connection
- **Viem** - Ethereum utilities
- **Vite** - Build tool

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MetaMask or another Web3 wallet

### Installation

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Update the contract address in `src/contracts/EthRewardPool.ts`:
```typescript
export const ETH_REWARD_POOL_ADDRESS = 'YOUR_DEPLOYED_CONTRACT_ADDRESS';
```

3. Get a WalletConnect Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/)

4. Update the project ID in `src/wagmi.ts`:
```typescript
projectId: 'YOUR_WALLETCONNECT_PROJECT_ID'
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── Header.tsx
│   │   ├── Hero.tsx
│   │   ├── StatsGrid.tsx
│   │   ├── JoinPoolCard.tsx
│   │   ├── ParticipantsList.tsx
│   │   ├── RecentWinners.tsx
│   │   └── RewardPoolApp.tsx
│   ├── contracts/           # Contract ABIs and addresses
│   │   └── EthRewardPool.ts
│   ├── hooks/              # Custom React hooks
│   │   └── usePoolData.ts
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   ├── index.css           # Global styles
│   └── wagmi.ts            # Wagmi configuration
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Usage

1. **Connect Wallet**: Click the "Connect Wallet" button in the header
2. **View Stats**: See current round, prize pool, participants, and time remaining
3. **Join Pool**: Enter an amount and click "Join Pool" to participate
4. **Distribute Reward**: When the round ends, click "Distribute Reward" to select a winner
5. **View Participants**: See all current participants in the list
6. **Check Winners**: View recent winners and their prizes

## Customization

### Colors

The app uses a black and white theme. To customize colors, edit `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      // Add your custom colors here
    }
  }
}
```

### Contract

To use a different contract or network:

1. Update the contract address in `src/contracts/EthRewardPool.ts`
2. Update the ABI if your contract interface differs
3. Update the chains in `src/wagmi.ts`

## Troubleshooting

### Wallet Connection Issues

- Make sure you have MetaMask or another Web3 wallet installed
- Check that you're on the correct network (Hardhat local or Sepolia)
- Try refreshing the page

### Transaction Failures

- Ensure you have enough ETH for gas fees
- Check that the round is still open
- Verify you haven't already joined the current round

### Contract Not Found

- Verify the contract address in `src/contracts/EthRewardPool.ts`
- Make sure the contract is deployed on the network you're connected to
- Check that your local Hardhat node is running (if using local network)

## License

MIT


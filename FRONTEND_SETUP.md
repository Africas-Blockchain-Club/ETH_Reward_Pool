# ETH Reward Pool - Complete Setup Guide

This guide will walk you through setting up and running the ETH Reward Pool application with its black and white themed frontend.

## 🚀 Quick Start

### Step 1: Deploy the Smart Contract

First, deploy the EthRewardPool contract to your local Hardhat network or testnet.

#### Option A: Local Hardhat Network

1. Start a local Hardhat node in one terminal:
```bash
npx hardhat node
```

2. In another terminal, deploy the contract:
```bash
npx hardhat run scripts/deploy-reward-pool.ts --network hardhatMainnet
```

#### Option B: Sepolia Testnet

1. Set up your Sepolia configuration variables:
```bash
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
npx hardhat keystore set SEPOLIA_RPC_URL
```

2. Deploy to Sepolia:
```bash
npx hardhat run scripts/deploy-reward-pool.ts --network sepolia
```

3. Copy the deployed contract address from the output.

### Step 2: Configure the Frontend

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Update the contract address in `src/contracts/EthRewardPool.ts`:
```typescript
export const ETH_REWARD_POOL_ADDRESS = 'YOUR_DEPLOYED_CONTRACT_ADDRESS' as const;
```

4. Get a WalletConnect Project ID:
   - Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
   - Create a new project
   - Copy your Project ID

5. Update the Project ID in `src/wagmi.ts`:
```typescript
export const config = getDefaultConfig({
  appName: 'ETH Reward Pool',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID',
  chains: [hardhat, sepolia],
  ssr: false,
});
```

### Step 3: Run the Frontend

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🎨 Features

### Black & White Theme
- Clean, minimalist design
- High contrast for accessibility
- Modern typography with Inter font
- Smooth animations and transitions

### Core Functionality
- **Wallet Connection**: Connect with MetaMask, WalletConnect, and other wallets
- **Real-time Stats**: Live updates of round info, prize pool, and participants
- **Join Pool**: Contribute ETH to join the current round
- **Distribute Rewards**: Trigger reward distribution when round ends
- **Participant List**: See all current participants
- **Recent Winners**: View past winners and prizes

## 📱 Using the Application

### 1. Connect Your Wallet
- Click "Connect Wallet" in the header
- Select your preferred wallet (MetaMask, WalletConnect, etc.)
- Approve the connection

### 2. View Pool Statistics
The stats grid shows:
- **Current Round**: The active round number
- **Prize Pool**: Total ETH in the pool
- **Participants**: Number of participants
- **Time Remaining**: Countdown to round end

### 3. Join the Pool
- Enter the amount of ETH you want to contribute
- Click "Join Pool"
- Confirm the transaction in your wallet
- Wait for confirmation

### 4. Distribute Rewards
When the round timer reaches 00:00:
- The "Distribute Reward" button becomes enabled
- Click it to trigger the reward distribution
- One random participant will be selected as the winner
- The winner receives all ETH in the pool

### 5. View Participants
- Scroll down to see all current participants
- Your address is highlighted if you've joined
- Each participant is numbered

## 🔧 Development

### Project Structure
```
frontend/
├── src/
│   ├── components/       # React components
│   ├── contracts/        # Contract ABIs and addresses
│   ├── hooks/           # Custom React hooks
│   ├── App.tsx          # Main app with providers
│   ├── main.tsx         # Entry point
│   └── wagmi.ts         # Web3 configuration
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

### Key Technologies
- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Wagmi**: React hooks for Ethereum
- **RainbowKit**: Beautiful wallet connection UI
- **Viem**: TypeScript Ethereum library
- **Vite**: Fast build tool

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🌐 Network Configuration

### Local Development (Hardhat)
The app is configured to work with Hardhat's local network by default.

### Testnet (Sepolia)
To use Sepolia:
1. Make sure you have Sepolia ETH
2. Deploy contract to Sepolia
3. Update contract address in frontend
4. Connect wallet to Sepolia network

### Adding Other Networks
Edit `src/wagmi.ts` to add more networks:
```typescript
import { mainnet, polygon, arbitrum } from 'wagmi/chains';

export const config = getDefaultConfig({
  // ...
  chains: [hardhat, sepolia, mainnet, polygon, arbitrum],
  // ...
});
```

## 🎯 Customization

### Styling
The app uses Tailwind CSS. Customize in `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      // Add custom colors
    },
    fontFamily: {
      // Change fonts
    }
  }
}
```

### Contract Interaction
All contract interactions are in:
- `src/contracts/EthRewardPool.ts` - ABI and address
- `src/hooks/usePoolData.ts` - Read contract data
- `src/components/JoinPoolCard.tsx` - Write operations

## 🐛 Troubleshooting

### "Contract not found" error
- Verify contract address in `src/contracts/EthRewardPool.ts`
- Ensure you're connected to the correct network
- Check that the contract is deployed

### Wallet won't connect
- Make sure MetaMask or another wallet is installed
- Check that you're on the correct network
- Try refreshing the page

### Transactions failing
- Ensure you have enough ETH for gas
- Check that the round is still open
- Verify you haven't already joined

### Time remaining not updating
- Refresh the page
- Check that your system time is correct
- Ensure the contract is deployed correctly

## 📦 Production Deployment

### Build the Frontend
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Environment Variables
For production, set:
- Contract address
- WalletConnect Project ID
- RPC URLs (if using custom providers)

## 🔐 Security Notes

- Never commit private keys or sensitive data
- Always verify contract addresses
- Test thoroughly on testnet before mainnet
- Use hardware wallets for large amounts
- Audit smart contracts before production use

## 📄 License

MIT License - feel free to use and modify!

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues or questions:
- Check the troubleshooting section
- Review the code comments
- Open an issue on GitHub

---

Happy coding! 🚀


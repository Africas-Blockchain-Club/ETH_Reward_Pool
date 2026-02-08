import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Header() {
  return (
    <header className="bg-black text-white border-b-2 border-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-black flex items-center gap-3">
            <span className="text-4xl">⚡</span>
            ETH Reward Pool
          </h1>
          <ConnectButton 
            chainStatus="icon"
            showBalance={false}
          />
        </div>
      </div>
    </header>
  );
}


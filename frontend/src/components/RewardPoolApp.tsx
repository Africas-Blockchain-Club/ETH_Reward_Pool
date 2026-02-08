import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Header } from './Header';
import { Hero } from './Hero';
import { StatsGrid } from './StatsGrid';
import { JoinPoolCard } from './JoinPoolCard';
import { ParticipantsList } from './ParticipantsList';
import { RecentWinners } from './RecentWinners';
import { ToastContainer } from './Toast';
import { usePoolData } from '../hooks/usePoolData';
import { useToast } from '../hooks/useToast';

export function RewardPoolApp() {
  const { isConnected } = useAccount();
  const [contributionAmount, setContributionAmount] = useState('0.01');
  const poolData = usePoolData();
  const toast = useToast();

  return (
    <div className="min-h-screen bg-white">
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Hero />
        
        <StatsGrid 
          roundId={poolData.roundId}
          poolBalance={poolData.poolBalance}
          participantCount={poolData.participantCount}
          timeRemaining={poolData.timeRemaining}
        />

        {isConnected ? (
          <>
            <JoinPoolCard
              contributionAmount={contributionAmount}
              setContributionAmount={setContributionAmount}
              roundClosed={poolData.roundClosed}
              userJoined={poolData.userJoined}
              refetch={poolData.refetch}
              toast={toast}
            />

            <ParticipantsList 
              participants={poolData.participants}
              currentUser={poolData.currentUser}
            />

            <RecentWinners />
          </>
        ) : (
          <div className="mt-12 text-center">
            <div className="card max-w-md mx-auto">
              <h3 className="text-2xl font-bold mb-4">Connect Your Wallet</h3>
              <p className="text-gray-600 mb-6">
                Please connect your wallet to join the reward pool and view participants.
              </p>
              <div className="text-6xl mb-4">🔌</div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t-2 border-black mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-600">
            ETH Reward Pool - A decentralized lottery system on Ethereum
          </p>
        </div>
      </footer>
    </div>
  );
}


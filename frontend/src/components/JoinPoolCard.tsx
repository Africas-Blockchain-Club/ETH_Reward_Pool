import { useState } from 'react';
import { parseEther } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ETH_REWARD_POOL_ABI, ETH_REWARD_POOL_ADDRESS } from '../contracts/EthRewardPool';

interface JoinPoolCardProps {
  contributionAmount: string;
  setContributionAmount: (amount: string) => void;
  roundClosed: boolean;
  userJoined: boolean;
  refetch: () => void;
}

export function JoinPoolCard({ 
  contributionAmount, 
  setContributionAmount, 
  roundClosed,
  userJoined,
  refetch 
}: JoinPoolCardProps) {
  const [isJoining, setIsJoining] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);

  const { writeContract: joinPool, data: joinHash } = useWriteContract();
  const { writeContract: distribute, data: distributeHash } = useWriteContract();

  const { isLoading: isJoinConfirming } = useWaitForTransactionReceipt({
    hash: joinHash,
  });

  const { isLoading: isDistributeConfirming } = useWaitForTransactionReceipt({
    hash: distributeHash,
  });

  const handleJoinPool = async () => {
    try {
      setIsJoining(true);
      const value = parseEther(contributionAmount);
      
      joinPool({
        address: ETH_REWARD_POOL_ADDRESS,
        abi: ETH_REWARD_POOL_ABI,
        functionName: 'joinPool',
        value,
      }, {
        onSuccess: () => {
          setTimeout(() => {
            refetch();
            setIsJoining(false);
          }, 2000);
        },
        onError: () => {
          setIsJoining(false);
        }
      });
    } catch (error) {
      console.error('Error joining pool:', error);
      setIsJoining(false);
    }
  };

  const handleDistribute = async () => {
    try {
      setIsDistributing(true);
      
      distribute({
        address: ETH_REWARD_POOL_ADDRESS,
        abi: ETH_REWARD_POOL_ABI,
        functionName: 'distributeReward',
      }, {
        onSuccess: () => {
          setTimeout(() => {
            refetch();
            setIsDistributing(false);
          }, 2000);
        },
        onError: () => {
          setIsDistributing(false);
        }
      });
    } catch (error) {
      console.error('Error distributing reward:', error);
      setIsDistributing(false);
    }
  };

  const isProcessing = isJoining || isJoinConfirming || isDistributing || isDistributeConfirming;

  return (
    <div className="card max-w-2xl mx-auto mb-12">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">Join Current Round</h3>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${roundClosed ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}></div>
          <span className="text-sm font-semibold">
            {roundClosed ? 'Round Closed' : 'Round Open'}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="amount" className="block text-sm font-semibold mb-2 uppercase tracking-wider">
            Contribution Amount (ETH)
          </label>
          <div className="relative">
            <input
              id="amount"
              type="number"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
              placeholder="0.01"
              step="0.001"
              min="0.000000000000000001"
              className="input-field pr-16"
              disabled={roundClosed || userJoined || isProcessing}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">
              ETH
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Minimum: 0.000000000000000001 ETH
          </p>
        </div>

        <button
          onClick={handleJoinPool}
          disabled={roundClosed || userJoined || isProcessing || !contributionAmount}
          className="btn btn-primary w-full text-lg"
        >
          {isJoining || isJoinConfirming ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⚡</span>
              {isJoinConfirming ? 'Confirming...' : 'Joining...'}
            </span>
          ) : userJoined ? (
            'Already Joined'
          ) : (
            'Join Pool'
          )}
        </button>

        <div className="border-t-2 border-gray-200 my-6"></div>

        <button
          onClick={handleDistribute}
          disabled={!roundClosed || isProcessing}
          className="btn btn-secondary w-full text-lg"
        >
          {isDistributing || isDistributeConfirming ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⚡</span>
              {isDistributeConfirming ? 'Confirming...' : 'Distributing...'}
            </span>
          ) : (
            'Distribute Reward'
          )}
        </button>
      </div>
    </div>
  );
}


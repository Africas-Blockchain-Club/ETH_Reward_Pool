import { useEffect, useState } from 'react';
import { useAccount, useReadContract, useBlockNumber } from 'wagmi';
import { ETH_REWARD_POOL_ABI, ETH_REWARD_POOL_ADDRESS } from '../contracts/EthRewardPool';

export function usePoolData() {
  const { address } = useAccount();
  const [timeRemaining, setTimeRemaining] = useState('--:--');
  const { data: blockNumber } = useBlockNumber({ watch: true });

  // Read contract data
  const { data: roundId, refetch: refetchRoundId } = useReadContract({
    address: ETH_REWARD_POOL_ADDRESS,
    abi: ETH_REWARD_POOL_ABI,
    functionName: 'roundId',
  });

  const { data: poolBalance, refetch: refetchBalance } = useReadContract({
    address: ETH_REWARD_POOL_ADDRESS,
    abi: ETH_REWARD_POOL_ABI,
    functionName: 'getPoolBalance',
  });

  const { data: participants, refetch: refetchParticipants } = useReadContract({
    address: ETH_REWARD_POOL_ADDRESS,
    abi: ETH_REWARD_POOL_ABI,
    functionName: 'getParticipants',
  });

  const { data: roundStart, refetch: refetchRoundStart } = useReadContract({
    address: ETH_REWARD_POOL_ADDRESS,
    abi: ETH_REWARD_POOL_ABI,
    functionName: 'roundStart',
  });

  const { data: roundDuration } = useReadContract({
    address: ETH_REWARD_POOL_ADDRESS,
    abi: ETH_REWARD_POOL_ABI,
    functionName: 'ROUND_DURATION',
  });

  // Calculate time remaining
  useEffect(() => {
    if (!roundStart || !roundDuration) return;

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const endTime = Number(roundStart) + Number(roundDuration);
      const remaining = endTime - now;

      if (remaining <= 0) {
        setTimeRemaining('00:00');
      } else {
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        setTimeRemaining(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [roundStart, roundDuration, blockNumber]);

  const roundClosed = (() => {
    if (!roundStart || !roundDuration) return false;
    const now = Math.floor(Date.now() / 1000);
    const endTime = Number(roundStart) + Number(roundDuration);
    return now >= endTime;
  })();

  const userJoined = participants?.some(
    (p) => p.toLowerCase() === address?.toLowerCase()
  ) ?? false;

  const refetch = () => {
    refetchRoundId();
    refetchBalance();
    refetchParticipants();
    refetchRoundStart();
  };

  return {
    roundId: roundId ?? 0n,
    poolBalance: poolBalance ?? 0n,
    participants: participants ?? [],
    participantCount: participants?.length ?? 0,
    timeRemaining,
    roundClosed,
    userJoined,
    currentUser: address,
    refetch,
  };
}


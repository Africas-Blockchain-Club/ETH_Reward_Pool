import { formatEther } from 'viem';
import { useState } from 'react';

interface Winner {
  roundId: bigint;
  winner: `0x${string}`;
  amount: bigint;
}

export function RecentWinners() {
  const [winners, setWinners] = useState<Winner[]>([]);

  // This is a simplified version - in production you'd want to use event logs
  // to get historical winners more efficiently
  
  return (
    <div className="card max-w-4xl mx-auto">
      <h3 className="text-2xl font-bold mb-6">Recent Winners</h3>
      {winners.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏆</div>
          <p className="text-gray-600">No winners yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {winners.map((winner, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200 hover:border-black transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">🏆</div>
                <div>
                  <div className="font-bold">Round {winner.roundId.toString()}</div>
                  <code className="text-sm text-gray-600">
                    {winner.winner.slice(0, 6)}...{winner.winner.slice(-4)}
                  </code>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{formatEther(winner.amount)} ETH</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


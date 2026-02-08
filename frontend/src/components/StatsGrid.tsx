import { formatEther } from 'viem';

interface StatsGridProps {
  roundId: bigint;
  poolBalance: bigint;
  participantCount: number;
  timeRemaining: string;
}

export function StatsGrid({ roundId, poolBalance, participantCount, timeRemaining }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      <StatCard label="Current Round" value={roundId.toString()} />
      <StatCard label="Prize Pool" value={`${formatEther(poolBalance)} ETH`} highlight />
      <StatCard label="Participants" value={participantCount.toString()} />
      <StatCard label="Time Remaining" value={timeRemaining} />
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function StatCard({ label, value, highlight }: StatCardProps) {
  return (
    <div className={`card ${highlight ? 'bg-black text-white' : ''}`}>
      <div className={`text-sm font-semibold uppercase tracking-wider mb-2 ${highlight ? 'text-gray-300' : 'text-gray-600'}`}>
        {label}
      </div>
      <div className="text-3xl md:text-4xl font-black">
        {value}
      </div>
    </div>
  );
}


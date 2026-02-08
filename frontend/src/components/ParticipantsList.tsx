interface ParticipantsListProps {
  participants: readonly `0x${string}`[];
  currentUser?: `0x${string}`;
}

export function ParticipantsList({ participants, currentUser }: ParticipantsListProps) {
  if (participants.length === 0) {
    return (
      <div className="card max-w-4xl mx-auto mb-12">
        <h3 className="text-2xl font-bold mb-6">Current Participants</h3>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <p className="text-gray-600">No participants yet. Be the first to join!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card max-w-4xl mx-auto mb-12">
      <h3 className="text-2xl font-bold mb-6">
        Current Participants ({participants.length})
      </h3>
      <div className="space-y-3">
        {participants.map((address, index) => (
          <div
            key={address}
            className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
              address.toLowerCase() === currentUser?.toLowerCase()
                ? 'border-black bg-black text-white'
                : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-black">
                {index + 1}
              </div>
              <code className="text-sm md:text-base font-mono">
                {address.slice(0, 6)}...{address.slice(-4)}
              </code>
            </div>
            {address.toLowerCase() === currentUser?.toLowerCase() && (
              <span className="text-xs font-bold uppercase tracking-wider bg-white text-black px-3 py-1 rounded">
                You
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


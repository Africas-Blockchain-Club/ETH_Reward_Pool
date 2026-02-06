import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAccount } from 'wagmi';
import { WalletConnect } from './components/WalletConnect';
import EthRewardPoolABI from './contracts/EthRewardPool.json';
import { contractAddress, formatEther, parseEther, formatTime } from './utils/contract';
import { RoundInfo, Participant } from './types';

declare global {
  interface Window {
    ethereum: any;
  }
}

function App() {
  const { address: account, isConnected } = useAccount();
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [roundInfo, setRoundInfo] = useState<RoundInfo>({
    roundId: 0,
    roundStart: 0,
    participants: [],
    poolBalance: '0',
    isRoundOpen: false,
    timeLeft: 0,
  });
  const [roundDuration, setRoundDuration] = useState<number>(60); // Default 60 seconds (1 minute)
  const [contributionAmount, setContributionAmount] = useState<string>('0.000000000000000001');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rewardHistory, setRewardHistory] = useState<Map<number, string>>(new Map());
  const [participantDetails, setParticipantDetails] = useState<Participant[]>([]);
  const [contractOwner, setContractOwner] = useState<string>('');

  // Initialize contract when wallet is connected
  useEffect(() => {
    const initContract = async () => {
      if (isConnected && account && window.ethereum) {
        try {
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await web3Provider.getSigner();

          const contractInstance = new ethers.Contract(
            contractAddress,
            EthRewardPoolABI,
            signer
          );
          setContract(contractInstance);
          console.log('Contract instance created for account:', account);
        } catch (error) {
          console.error('Error initializing contract:', error);
        }
      } else {
        setContract(null);
      }
    };

    initContract();
  }, [isConnected, account]);

  // Load contract data and set up polling
  useEffect(() => {
    if (contract && account) {
      loadContractData();
      const interval = setInterval(() => {
        updateRoundStatus();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [contract, account]);

  // Listen for chain changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
  }, []);

  const loadContractData = async () => {
    if (!contract) return;

    try {
      const [roundId, roundStart, participants, poolBalance, contractRoundDuration, owner] = await Promise.all([
        contract.roundId(),
        contract.roundStart(),
        contract.getParticipants(),
        contract.getPoolBalance(),
        contract.ROUND_DURATION(),
        contract.owner(),
      ]);

      setContractOwner(owner.toLowerCase());

      const roundStartNum = Number(roundStart);
      const roundDurationNum = Number(contractRoundDuration);
      const currentTime = Math.floor(Date.now() / 1000);

      // Store the round duration from contract
      setRoundDuration(roundDurationNum);

      // Calculate time left
      let timeLeft = 0;
      let isRoundOpen = false;

      console.log('Round Info:', {
        roundId: Number(roundId),
        roundStartNum,
        roundDurationNum,
        currentTime,
        participantCount: participants?.length || 0
      });

      if (roundStartNum > 0) {
        // Round has started
        timeLeft = Math.max(0, roundStartNum + roundDurationNum - currentTime);
        isRoundOpen = timeLeft > 0;
        console.log('Round started - timeLeft:', timeLeft, 'isRoundOpen:', isRoundOpen);
      } else {
        // Round hasn't started yet (waiting for first participant)
        timeLeft = roundDurationNum; // Show full duration
        isRoundOpen = true; // Allow joining
        console.log('Round not started yet - waiting for first participant');
      }

      setRoundInfo({
        roundId: Number(roundId),
        roundStart: roundStartNum,
        participants: participants || [],
        poolBalance: formatEther(poolBalance),
        isRoundOpen,
        timeLeft,
      });

      await loadRewardHistory(Number(roundId));
      await loadParticipantDetails(participants || []);
    } catch (error) {
      console.error('Error loading contract data:', error);
    }
  };

  const loadRewardHistory = async (currentRoundId: number) => {
    if (!contract) return;

    const history = new Map<number, string>();
    for (let i = 1; i < currentRoundId; i++) {
      try {
        const winner = await contract.getRewardRecipient(i);
        if (winner && winner !== ethers.ZeroAddress) {
          history.set(i, winner);
        }
      } catch (error) {
        console.error(`Error loading reward for round ${i}:`, error);
      }
    }
    setRewardHistory(history);
  };

  const loadParticipantDetails = async (participants: string[]) => {
    if (!contract || !account) return;

    const details: Participant[] = await Promise.all(
      participants.map(async (address) => ({
        address,
        hasJoined: await contract.hasJoined(address),
      }))
    );
    setParticipantDetails(details);
  };

  const updateRoundStatus = () => {
    setRoundInfo(prev => {
      if (prev.timeLeft <= 0) return prev;
      const newTimeLeft = prev.timeLeft - 1;
      return {
        ...prev,
        timeLeft: newTimeLeft,
        isRoundOpen: newTimeLeft > 0,
      };
    });
  };

  const handleJoinPoolClick = () => {
    console.log('Join Pool button clicked!');
    console.log('Button state:', {
      isRoundOpen: roundInfo.isRoundOpen,
      isLoading,
      account,
      disabled: !roundInfo.isRoundOpen || isLoading || !account
    });

    if (!roundInfo.isRoundOpen) {
      console.warn('Cannot join: Round is not open');
      alert('Cannot join: Round is not open. Please wait for a new round or distribute rewards if round has ended.');
      return;
    }

    if (!account) {
      console.warn('Cannot join: Wallet not connected');
      alert('Please connect your wallet first!');
      return;
    }

    if (isLoading) {
      console.warn('Cannot join: Transaction in progress');
      return;
    }

    joinPool();
  };

  const joinPool = async () => {
    if (!contract || !account) {
      alert('Please connect your wallet first!');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Attempting to join pool with amount:', contributionAmount);

      const amount = parseEther(contributionAmount);
      console.log('Parsed amount (wei):', amount.toString());

      console.log('Sending transaction...');
      const tx = await contract.joinPool({ value: amount });
      console.log('Transaction sent:', tx.hash);

      console.log('Waiting for confirmation...');
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      alert('Successfully joined the pool!');
      await loadContractData();
    } catch (error: any) {
      console.error('Error joining pool:', error);

      // More detailed error message
      let errorMessage = 'Unknown error occurred';
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      }

      // Check for common errors
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        errorMessage = 'Transaction was rejected by user';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds in your wallet';
      }

      alert(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const distributeReward = async () => {
    if (!contract) return;

    try {
      setIsLoading(true);
      console.log('Attempting to distribute reward...');

      const tx = await contract.distributeReward();
      console.log('Transaction sent:', tx.hash);

      console.log('Waiting for confirmation...');
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      alert('Reward distributed successfully! A new round has started.');
      await loadContractData();
    } catch (error: any) {
      console.error('Error distributing reward:', error);

      let errorMessage = 'Unknown error occurred';
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      }

      // Check for common errors
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        errorMessage = 'Transaction was rejected by user';
      } else if (error.message?.includes('Round is still active')) {
        errorMessage = 'Cannot distribute reward - round is still active';
      } else if (error.message?.includes('No participants')) {
        errorMessage = 'Cannot distribute reward - no participants in the pool';
      }

      alert(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-center gap-4 py-4 sm:py-6 border-b border-gray-700">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent text-center sm:text-left">
            🎲 ETH Reward Pool
          </h1>

          <WalletConnect />
        </header>

        {/* Main Dashboard */}
        <main className="mt-4 sm:mt-6 md:mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column: Round Info */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Round Status Card */}
            <div className="bg-gray-800 rounded-xl p-4 sm:p-6 shadow-2xl border border-gray-700">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Current Round #{roundInfo.roundId}</h2>

              {roundInfo.roundStart === 0 && (
                <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-400 text-xs sm:text-sm">
                    ⏳ Round will start when the first participant joins!
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm sm:text-base">Pool Balance:</span>
                    <span className="text-lg sm:text-2xl font-bold text-green-400">{roundInfo.poolBalance} ETH</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm sm:text-base">Participants:</span>
                    <span className="text-lg sm:text-xl font-semibold">{roundInfo.participants.length}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm sm:text-base">Status:</span>
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${roundInfo.isRoundOpen ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {roundInfo.isRoundOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm sm:text-base">Time Remaining:</span>
                    <span className="text-lg sm:text-2xl font-bold text-yellow-400 font-mono">
                      {formatTime(roundInfo.timeLeft)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm sm:text-base">Min Contribution:</span>
                    <span className="font-mono text-xs sm:text-sm">0.000000000000000001 ETH</span>
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Round Progress</span>
                  <span>{Math.max(0, 100 - (roundInfo.timeLeft / roundDuration * 100)).toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000"
                    style={{ width: `${Math.max(0, 100 - (roundInfo.timeLeft / roundDuration * 100))}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-gray-800 rounded-xl p-4 sm:p-6 shadow-2xl border border-gray-700">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Actions</h2>

              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <label className="block text-gray-400 text-sm sm:text-base">Contribution Amount (ETH)</label>
                  <input
                    type="text"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.000000000000000001"
                  />
                  <p className="text-xs sm:text-sm text-gray-500">Minimum: 0.000000000000000001 ETH</p>
                </div>

                {/* Status Messages */}
                {!account && (
                  <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                    <p className="text-yellow-400 text-xs sm:text-sm">
                      ⚠️ Please connect your wallet to join the pool
                    </p>
                  </div>
                )}

                {account && !roundInfo.isRoundOpen && roundInfo.timeLeft === 0 && roundInfo.participants.length > 0 && (
                  <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 text-xs sm:text-sm">
                      ⏰ Round has ended. {account.toLowerCase() === contractOwner ? 'You can distribute rewards to start a new round.' : 'Waiting for contract owner to distribute rewards.'}
                    </p>
                  </div>
                )}

                {account && roundInfo.isRoundOpen && roundInfo.roundStart === 0 && (
                  <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <p className="text-green-400 text-xs sm:text-sm">
                      🎉 Be the first to join! The 10-second timer will start when you join.
                    </p>
                  </div>
                )}

                {/* Debug Info - Remove this after testing */}
                <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-400 text-xs font-mono">
                    DEBUG: isRoundOpen={roundInfo.isRoundOpen.toString()} |
                    timeLeft={roundInfo.timeLeft} |
                    roundStart={roundInfo.roundStart} |
                    participants={roundInfo.participants.length} |
                    account={account ? 'connected' : 'not connected'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <button
                    onClick={handleJoinPoolClick}
                    disabled={!roundInfo.isRoundOpen || isLoading || !account}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-lg transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100"
                  >
                    {isLoading ? 'Processing...' : 'Join Pool'}
                  </button>

                  <button
                    onClick={distributeReward}
                    disabled={roundInfo.isRoundOpen || isLoading || !account || account.toLowerCase() !== contractOwner}
                    className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-lg transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100"
                    title={account && account.toLowerCase() !== contractOwner ? 'Only contract owner can distribute rewards' : ''}
                  >
                    {isLoading ? 'Processing...' : 'Distribute Reward (Owner Only)'}
                  </button>
                </div>
              </div>
            </div>

            {/* Participants Card */}
            <div className="bg-gray-800 rounded-xl p-4 sm:p-6 shadow-2xl border border-gray-700">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Participants ({participantDetails.length})</h2>

              <div className="max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {participantDetails.length > 0 ? (
                    participantDetails.map((participant, index) => (
                      <div
                        key={index}
                        className={`p-2 sm:p-3 rounded-lg ${account && participant.address.toLowerCase() === account.toLowerCase() ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-gray-900/50'}`}
                      >
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs sm:text-sm font-bold">{index + 1}</span>
                            </div>
                            <span className="font-mono text-xs sm:text-sm truncate">
                              {participant.address.slice(0, 6)}...{participant.address.slice(-4)}
                              {account && participant.address.toLowerCase() === account.toLowerCase() && (
                                <span className="ml-1 sm:ml-2 text-xs bg-blue-500 px-1 sm:px-2 py-0.5 sm:py-1 rounded">You</span>
                              )}
                            </span>
                          </div>
                          <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs rounded flex-shrink-0 ${participant.hasJoined ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                            {participant.hasJoined ? 'Joined' : 'Not Joined'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 sm:py-8 text-gray-500 text-sm sm:text-base">
                      No participants yet. Be the first to join!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: History & Info */}
          <div className="space-y-4 sm:space-y-6">
            {/* Reward History */}
            <div className="bg-gray-800 rounded-xl p-4 sm:p-6 shadow-2xl border border-gray-700">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">🎉 Reward History</h2>

              <div className="space-y-2 sm:space-y-3 max-h-80 overflow-y-auto">
                {Array.from(rewardHistory.entries()).map(([roundId, winner]) => (
                  <div key={roundId} className="p-2 sm:p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition-colors">
                    <div className="flex justify-between items-center mb-1 sm:mb-2">
                      <span className="font-bold text-sm sm:text-base text-blue-400">Round #{roundId}</span>
                      <span className="text-xs text-gray-500">Completed</span>
                    </div>
                    <div className="text-xs sm:text-sm">
                      <div className="text-gray-400 mb-1">Winner:</div>
                      <div className="font-mono text-xs break-all">{winner}</div>
                    </div>
                  </div>
                ))}

                {rewardHistory.size === 0 && (
                  <div className="text-center py-6 sm:py-8 text-gray-500 text-sm sm:text-base">
                    No reward history yet. Be the first winner!
                  </div>
                )}
              </div>
            </div>

            {/* Contract Info */}
            <div className="bg-gray-800 rounded-xl p-4 sm:p-6 shadow-2xl border border-gray-700">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">📋 Contract Info</h2>

              <div className="space-y-2 sm:space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                  <span className="text-gray-400 text-sm sm:text-base">Contract Address:</span>
                  <a
                    href={`https://sepolia.etherscan.io/address/${contractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 font-mono text-xs sm:text-sm break-all sm:break-normal"
                  >
                    {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
                  </a>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm sm:text-base">Network:</span>
                  <span className="text-sm sm:text-base">Sepolia Testnet</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm sm:text-base">Round Duration:</span>
                  <span className="text-sm sm:text-base">10 seconds</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                  <span className="text-gray-400 text-sm sm:text-base">Contract Owner:</span>
                  <span className="font-mono text-xs sm:text-sm break-all sm:break-normal">
                    {contractOwner ? `${contractOwner.slice(0, 6)}...${contractOwner.slice(-4)}` : 'Loading...'}
                    {account && contractOwner && account.toLowerCase() === contractOwner && (
                      <span className="ml-1 sm:ml-2 text-xs bg-purple-500 px-1 sm:px-2 py-0.5 sm:py-1 rounded">You</span>
                    )}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                  <span className="text-gray-400 text-sm sm:text-base">Current Account:</span>
                  <span className="font-mono text-xs sm:text-sm break-all sm:break-normal">
                    {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Not connected'}
                  </span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl p-4 sm:p-6 shadow-2xl border border-blue-500/30">
              <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">📖 How It Works</h2>

              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2 flex-shrink-0">1.</span>
                  <span>Connect your MetaMask wallet</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2 flex-shrink-0">2.</span>
                  <span>Join the pool with minimum 0.000000000000000001 ETH</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2 flex-shrink-0">3.</span>
                  <span>Timer starts at 10 seconds when first user joins</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2 flex-shrink-0">4.</span>
                  <span>After 10 seconds, contract owner distributes reward</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2 flex-shrink-0">5.</span>
                  <span>One random participant wins entire pool!</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2 flex-shrink-0">🔄</span>
                  <span>New round starts automatically after distribution</span>
                </li>
              </ul>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-700 text-center text-gray-500 text-xs sm:text-sm">
          <p>Build by Kahuna</p>
          <p className="mt-1 sm:mt-2">@Copyright reserved</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
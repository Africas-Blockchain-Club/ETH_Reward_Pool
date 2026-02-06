import { useAccount, useConnect, useDisconnect } from 'wagmi'

export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  const handleConnect = () => {
    // Find MetaMask connector first, fallback to first available connector
    const metaMaskConnector = connectors.find(
      (connector) => connector.name.toLowerCase().includes('metamask')
    )
    const connectorToUse = metaMaskConnector || connectors[0]

    if (connectorToUse) {
      connect({ connector: connectorToUse })
    }
  }

  if (isConnected && address) {
    return (
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
        <div className="bg-gray-800 px-3 sm:px-4 py-2 rounded-lg w-full sm:w-auto">
          <span className="text-gray-400 text-xs sm:text-sm">Connected:</span>
          <span className="ml-2 font-mono text-xs sm:text-sm">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        <button
          onClick={() => disconnect()}
          className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-semibold transition-all w-full sm:w-auto"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleConnect}
      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
    >
      Connect Wallet
    </button>
  )
}


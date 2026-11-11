// Single source of truth for supported networks on the frontend.
// Mirrors backend/src/config/networks.js. Contract addresses arrive in Phase 5/7.
// chainId is used by wallet/contract logic; user-facing UI shows only the name.

export const NETWORKS = {
  sepolia: {
    key: 'sepolia',
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    chainIdHex: '0xaa36a7',
    dotClass: 'bg-sky-400',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'],
    explorerUrl: 'https://sepolia.etherscan.io',
  },
  baseSepolia: {
    key: 'baseSepolia',
    name: 'Base Sepolia',
    chainId: 84532,
    chainIdHex: '0x14a34',
    dotClass: 'bg-blue-500',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [import.meta.env.VITE_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'],
    explorerUrl: 'https://sepolia.basescan.org',
  },
}

export const NETWORK_LIST = Object.values(NETWORKS)

export const DEFAULT_NETWORK = NETWORKS.sepolia

export function getNetworkByChainId(chainId) {
  return NETWORK_LIST.find((n) => n.chainId === Number(chainId)) || null
}

export function isSupportedChainId(chainId) {
  return Boolean(getNetworkByChainId(chainId))
}

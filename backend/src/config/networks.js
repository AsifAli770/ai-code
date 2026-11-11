import 'dotenv/config';

/**
 * Single source of truth for supported blockchain networks.
 * Contract addresses are filled in after deployment (Phase 5/7).
 * NFTs are independent per network: always key on (chainId, contractAddress, tokenId).
 */
const env = (name) => process.env[name]?.trim() || null;

export const NETWORKS = Object.freeze({
  sepolia: Object.freeze({
    key: 'sepolia',
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    rpcUrl: env('SEPOLIA_RPC_URL') || 'https://ethereum-sepolia-rpc.publicnode.com',
    explorerUrl: 'https://sepolia.etherscan.io',
    nftContract: env('SEPOLIA_NFT_CONTRACT'),
    marketplaceContract: env('SEPOLIA_MARKETPLACE_CONTRACT'),
  }),
  baseSepolia: Object.freeze({
    key: 'baseSepolia',
    name: 'Base Sepolia',
    chainId: 84532,
    rpcUrl: env('BASE_SEPOLIA_RPC_URL') || 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org',
    nftContract: env('BASE_SEPOLIA_NFT_CONTRACT'),
    marketplaceContract: env('BASE_SEPOLIA_MARKETPLACE_CONTRACT'),
  }),
});

export const SUPPORTED_CHAIN_IDS = Object.freeze(Object.values(NETWORKS).map((n) => n.chainId));

export function getNetworkByChainId(chainId) {
  return Object.values(NETWORKS).find((n) => n.chainId === Number(chainId)) || null;
}

export function isSupportedChainId(chainId) {
  return SUPPORTED_CHAIN_IDS.includes(Number(chainId));
}

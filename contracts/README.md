# Smart contracts

Hardhat 3 + OpenZeppelin 5.6 + ethers v6. Solidity 0.8.34.

| Contract | Purpose |
|---|---|
| `contracts/NFTCollection.sol` | ERC-721 built on OpenZeppelin `ERC721URIStorage`. `mint(uri)` mints to the caller and stores that token's own `ipfs://…` metadata URI; `tokenURI(id)` returns it. Emits `NFTMinted(tokenId, creator, tokenURI)`. No owner or admin. |
| `contracts/NFTMarketplace.sol` | Fixed-price marketplace: `listItem`, `buyItem`, `cancelListing`, `withdrawProceeds`. |
| `contracts/test/ReentrancyAttackers.sol` | **Test-only** attacker contracts used by the unit tests. |

## Marketplace security

- **Escrow:** `listItem` moves the NFT into the marketplace. While listed, the seller can't transfer or
  sell it elsewhere. Cancelling returns it; buying delivers it to the buyer.
- **Pull payments:** a sale credits `proceeds[seller]`; the seller calls `withdrawProceeds()` later.
  Sellers never receive ETH inside someone else's purchase, so a seller that rejects ETH can't block sales.
- **Reentrancy:** every state-changing function is `nonReentrant` (OpenZeppelin `ReentrancyGuard`) and
  follows checks-effects-interactions: listings are closed and balances zeroed *before* any external call.
- **Exact payment:** `buyItem` requires `msg.value == price` (no under- or over-payment).
- **No admin and no fees:** no owner role, no privileged private key, no `selfdestruct`/upgrade path.
- Plain ETH sent to the marketplace and NFTs sent to it directly are rejected, so nothing gets stuck.

## Commands

```bash
cd contracts
npm install
npm run compile
npm test             # all tests on Hardhat's in-memory chain
npm run deploy:sim   # deploy to a throwaway in-memory chain (just checks the deployment works)

# Long-running local chain (for connecting MetaMask / the app later):
npm run node         # terminal 1: prints 20 TEST accounts (public keys, fake ETH)
npm run deploy:local # terminal 2: deploys to it
```

Everything here uses **Hardhat's built-in test accounts**. Their private keys are publicly known and only
valid on local chains, so there's no real ETH and nothing to protect. Never send real funds to them.

Testnet deployment (Sepolia, Base Sepolia) is Phase 7.

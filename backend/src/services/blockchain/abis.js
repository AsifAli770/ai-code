import { Interface } from 'ethers';

/**
 * Human-readable ABI fragments for the parts of NFTCollection the backend uses.
 * Must match contracts/contracts/NFTCollection.sol.
 */
export const NFT_COLLECTION_ABI = [
  'event NFTMinted(uint256 indexed tokenId, address indexed creator, string tokenURI)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function mint(string uri) returns (uint256)',
];

export const nftCollectionInterface = new Interface(NFT_COLLECTION_ABI);

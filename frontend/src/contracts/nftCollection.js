// Human-readable ABI for the parts of NFTCollection the frontend calls.
// Must match contracts/contracts/NFTCollection.sol.
export const NFT_COLLECTION_ABI = [
  'function mint(string uri) returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'event NFTMinted(uint256 indexed tokenId, address indexed creator, string tokenURI)',
]

import { Link } from 'react-router-dom'
import { getNetworkByChainId } from '../../config/networks'
import { assetUrl } from '../../utils/assets'
import IpfsImage from './IpfsImage'

/**
 * NFT card. The image comes from IPFS (with gateway fallbacks and the app's own
 * copy as a last resort), and a visible link opens it on the IPFS gateway.
 */
export default function NftCard({ nft }) {
  const network = getNetworkByChainId(nft.chainId)
  const fallback = nft.localImage ? assetUrl(nft.localImage) : null

  const media = (
    <div className="relative aspect-square">
      <IpfsImage
        cid={nft.imageCID}
        gatewayUrl={nft.imageGatewayUrl}
        fallbackSrc={fallback}
        alt={nft.name}
        className="h-full w-full"
      />
      <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-ink-950/85 px-2.5 py-1 text-xs font-semibold text-slate-100 shadow-lg shadow-black/40 ring-1 ring-white/15 backdrop-blur-sm">
        <span className={`h-1.5 w-1.5 rounded-full ${network?.dotClass ?? 'bg-slate-400'}`} aria-hidden="true" />
        {network?.name ?? `Chain ${nft.chainId}`}
      </span>
    </div>
  )

  const title = (
    <div className="px-4 pt-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 truncate font-semibold text-white">{nft.name}</h3>
        <span className="shrink-0 font-mono text-xs text-slate-400">#{nft.tokenId}</span>
      </div>
      <p className="mt-1 truncate text-xs text-slate-400">{nft.collectionName || 'No collection'}</p>
    </div>
  )

  return (
    <article className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-white/20">
      {nft.generation ? (
        <Link to={`/studio/${nft.generation}`} className="block">
          {media}
          {title}
        </Link>
      ) : (
        <>
          {media}
          {title}
        </>
      )}

      <div className="mt-auto flex items-center gap-3 px-4 pb-4 pt-3 text-xs">
        {nft.imageGatewayUrl && (
          <a
            href={nft.imageGatewayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand-300 hover:text-brand-200"
          >
            View image on IPFS ↗
          </a>
        )}
        {nft.metadataGatewayUrl && (
          <a
            href={nft.metadataGatewayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white"
          >
            Metadata ↗
          </a>
        )}
      </div>
    </article>
  )
}

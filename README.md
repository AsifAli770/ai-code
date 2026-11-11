# AI-Powered Multi-Chain NFT Marketplace

Full-stack Web3 portfolio project: generate artwork with local AI, pin it to IPFS, mint ERC-721
NFTs and trade them on **Ethereum Sepolia** and **Base Sepolia**. Testnets only, no real funds.

| Folder       | Stack                                                       | Status   |
|--------------|-------------------------------------------------------------|----------|
| `backend/`   | Node 22, Express 5, MongoDB Atlas (Mongoose), JWT, bcrypt, ethers v6, multer | Phase 3 |
| `frontend/`  | React 19, Vite, Tailwind CSS v4, React Router, Axios, ethers v6              | Phase 3 |
| `contracts/` | Hardhat 3, Solidity 0.8.34, OpenZeppelin 5.6, ethers v6 (see `contracts/README.md`) | Phase 5 |
| `docs/`      | Postman collections                                         |          |

## Prerequisites

- **Node.js 22+** and npm (`node -v`)
- A **MongoDB Atlas** cluster (free tier) and its connection string
- Git

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env        # PowerShell: Copy-Item .env.example .env
```

Edit `backend/.env`:

- `MONGODB_URI`: your Atlas connection string. Include a database name before the `?`, e.g.
  `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/ai_nft_marketplace?retryWrites=true&w=majority`.
  In Atlas, make sure **Network Access** allows your current IP.
- `JWT_SECRET`: generate one with
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

Run it:

```bash
npm run dev        # starts http://localhost:5000/api with auto-reload
npm test           # runs API tests against an in-memory MongoDB (no Atlas needed)
```

Check: open http://localhost:5000/api/health and you should see `"database": "connected"`.

### Create the admin account

There is no public way to become admin. Set the credentials in `backend/.env`:

```
ADMIN_NAME=Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=a-strong-password-123
```

Then run:

```bash
npm run seed:admin                     # create the admin (or promote an existing user with that email)
npm run seed:admin -- --reset-password # also reset that user's password to ADMIN_PASSWORD
```

The seeder is safe to run repeatedly. To promote any other registered user:
`npm run make-admin -- user@example.com`.

## 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env        # VITE_API_URL=http://localhost:5000/api
npm run dev                 # http://localhost:5173
npm test                    # wallet logic tests (Vitest + jsdom, mocked MetaMask)
```

## 3. Wallet (Phase 2)

You need the **MetaMask** browser extension and a little free test ETH from a Sepolia or Base Sepolia
faucet (search "Sepolia faucet" / "Base Sepolia faucet"; most require a free sign-in).

- **Connect / disconnect**: navbar button (after login). "Disconnect" also revokes the site's
  MetaMask permission where supported, and is remembered across reloads.
- **Network switching**: Ethereum Sepolia and Base Sepolia. If MetaMask doesn't know the network yet,
  the app asks MetaMask to add it. Any other network shows a warning banner.
- **Balance**: ETH balance for the currently selected network; refreshes on account/network change.
- **Verify & link wallet** (dashboard): proves ownership by signature. No transaction, no gas.

How wallet verification works:

1. `POST /api/wallet/nonce` → the backend creates a random 128-bit nonce bound to *(user, address,
   chain)* and builds the exact message to sign (EIP-4361 / Sign-In with Ethereum format, showing the
   site's domain). It expires after `WALLET_NONCE_TTL_SECONDS` (default 5 min). Requesting a new one
   invalidates the previous one.
2. MetaMask signs the message (`personal_sign`). The private key never leaves MetaMask.
3. `POST /api/wallet/verify` (body: only `{ nonce, signature }`) → the backend:
   - atomically marks the nonce used, so it can never be replayed, even after a failed attempt;
   - checks expiry explicitly (`expiresAt > now`). MongoDB's TTL index only *cleans up* expired
     nonces, asynchronously, so it can't be relied on to enforce expiry;
   - re-validates every EIP-4361 field of the stored message: domain, URI, version, address,
     chain ID (must be supported), nonce, issued-at (≤ now + 60 s clock skew) and expiration time.
     `ethers.verifyMessage` only proves *who* signed, not *what* they agreed to;
   - recovers the signer and links the wallet only if it matches the challenged address.
4. One wallet = one account, enforced by a **unique MongoDB index** on the normalized (lowercase)
   address. The code also checks first for a friendly error, but only the index is race-safe when two
   accounts try to link the same wallet at the same moment.

About chain IDs: the Chain ID in a signed message is just text, not proof of which network MetaMask
was on. The backend validates it against the supported-network config, and the frontend asks
MetaMask for its current chain right before signing and aborts if it changed.

Supports regular MetaMask accounts (EOAs). Smart-contract wallets (ERC-1271) are not supported yet.

## 4. Artwork (Phase 3)

- **Create** (`/studio`): upload artwork (drag and drop or browse), add a name, description,
  collection name, style and traits, then save it as a **draft**.
- **My artwork** (`/artwork`): your drafts, newest first, 12 per page. Open one to edit its details or
  delete it. Minted artwork (Phase 6) becomes read-only.

Upload rules: PNG, JPEG, WebP or GIF, up to `MAX_UPLOAD_MB` (default 10 MB), 64 to 8192 px per side.
The server identifies the type from the file's **bytes**, not its name or the browser's Content-Type,
so an SVG or text file renamed to `.png` is rejected. SVG is never accepted because it can contain
scripts. Files get random UUID names and are stored in `backend/uploads/` (ignored by git), served
from `/uploads/...`. This is the draft area; permanent NFT storage is IPFS (Phase 4).

### AI suggestions (Groq)

On the Create/Edit page, describe the artwork in a few words and click **Suggest details**. The AI
(via [Groq](https://console.groq.com)) proposes a name, description, collection name and traits.
Nothing changes until you click **Use these details**, and everything stays editable.

Setup (free plan):
1. Sign up at https://console.groq.com, then open **API Keys** → **Create API Key**.
2. Put it in `backend/.env`: `GROQ_API_KEY=gsk_...` (and keep `AI_TEXT_PROVIDER=groq`). Restart the backend.
3. Stay on the free plan: don't add a payment method or upgrade.

Notes:
- **Free plan limits:** Groq rate-limits free accounts (requests and tokens per minute/day; see
  **Settings → Limits** in the Groq console). When a limit is hit, the app shows "The free Groq limit
  has been reached" (HTTP 429). The app also limits each user to 20 suggestions per 10 minutes and one
  at a time.
- **Privacy:** prompts are sent to Groq, an external service. Don't type anything private.
- The key stays on the server: it's sent to Groq only in the `Authorization` header, is never logged
  and never reaches the browser.
- Default model: `openai/gpt-oss-20b`, which supports schema-checked JSON output. You can switch with
  `GROQ_MODEL` (e.g. `llama-3.3-70b-versatile`, which uses plain JSON mode instead).
- Without a key, or with `AI_TEXT_PROVIDER=none`, the panel says AI is unavailable and you fill in
  details by hand. Image generation stays off (`AI_IMAGE_PROVIDER=none`): upload your own artwork.

## 5. IPFS (Phase 4)

Open an artwork → **Upload to IPFS**. The server pins two things to IPFS through
[Pinata](https://app.pinata.cloud) (free plan; the JWT stays in `backend/.env`):

1. **Image** → `ipfs://<imageCID>`
2. **Metadata JSON** (ERC-721 / OpenSea format, built only from data stored on the server):
   ```json
   { "name": "...", "description": "...", "image": "ipfs://<imageCID>",
     "attributes": [{ "trait_type": "Mood", "value": "Mysterious" }],
     "properties": { "collection": "..." } }
   ```
   → `ipfs://<metadataCID>`, the **token URI** the NFT contract will store in Phase 6.

Afterwards the details are locked, because the NFT will point to exactly this content.

**Retries never create duplicate uploads:**
- Each step's CID is saved the moment it succeeds. If the image upload works but the metadata upload
  fails, the artwork shows "IPFS: retry needed" and **Retry upload** continues with the metadata only.
- Every upload is labelled on Pinata with `{ app, generationId, kind, sha256 }`. Before uploading, the
  server looks for a file with exactly those labels. That covers the worst case, where Pinata stored the
  file but the response was lost (timeout, crash): the retry finds and reuses it.
- A 2-minute atomic lease stops double-clicks or two tabs from publishing at the same time (the second
  gets "already in progress"). It expires on its own if the server crashes. Edits and deletes are blocked
  while an upload runs.
- `POST /api/ai/generations/:id/ipfs` is idempotent: calling it after success just returns the result.

Setup: create a free account at https://app.pinata.cloud → **API Keys** → **New Key** (admin, or file
read + write) → copy the **JWT** into `backend/.env` as `PINATA_JWT=...`. Optionally set
`IPFS_GATEWAY_URL` to your free dedicated gateway (`https://<name>.mypinata.cloud/ipfs`) for faster
image previews. Pinned files stay on Pinata even if you delete the draft. Pinning keeps content
available only while it stays pinned, and the free plan's storage and file limits apply.

## 6. Minting (Phase 6)

On an artwork that is **On IPFS**, the **Mint NFT** panel calls `NFTCollection.mint(tokenURI)` from the
user's own MetaMask wallet (the backend holds no keys and sends no transactions). Then:

1. The tx hash is sent to the backend right away and saved on the artwork. If the tab closes, **Check
   status** finishes the job later.
2. After the transaction is mined, the backend verifies it **on-chain** before recording anything:
   supported network, receipt succeeded, enough confirmations (1 local, 2 testnets), sent to **our** NFT
   contract, `NFTMinted` emitted by that contract, minter == the user's **signature-verified** wallet,
   and token URI == the artwork's `ipfs://<metadataCID>`. The current owner is read from `ownerOf()`.
3. Only then are the NFT (chainId, contract, tokenId, owner, tx hash, block) and a `MINT` transaction
   saved, and the artwork marked **Minted**. Unique indexes make duplicates impossible, and reporting
   the same transaction again is idempotent.

**My NFTs** lists NFTs owned by your verified wallet. **Verify ownership on-chain** re-reads `ownerOf()`.

### Local chain setup (development)
1. `cd contracts && npm run node`: keep this terminal open. It prints 20 **public test accounts**.
2. In another terminal: `npm run deploy:local`. Put the two addresses into `backend/.env`:
   `HARDHAT_NFT_CONTRACT=…` and `HARDHAT_MARKETPLACE_CONTRACT=…` (on a fresh node they are always
   `0x5FbDB2315678afecb367f032d93F642f64180aa3` and `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`).
   Restart the backend.
3. MetaMask → Add network manually: name `Hardhat Local`, RPC `http://127.0.0.1:8545`, chain ID
   `31337`, currency `ETH`. Or just pick "Hardhat Local" in the app's network menu.
4. MetaMask → Add account → **Import account** → paste the private key of Hardhat **Account #1** (from
   the `npm run node` output). Name it "HARDHAT TEST – DO NOT USE". These keys are public: never send
   real funds to them or use them on a real network.
5. In the app, verify that account (Dashboard → Verify & link wallet), then mint.

Restarting `npm run node` wipes the local chain. Redeploy with **`npm run deploy:local:reset`**: plain
`deploy:local` may skip deploying because Ignition remembers the previous chain's deployment. On a fresh
node the addresses are the same, so `.env` stays valid. Then reset MetaMask's cached nonce: in
Settings, search for **"Clear activity"** (under Developer tools in newer versions, Advanced in older
ones).

## 7. Marketplace (Phase 8, tested on the local Hardhat chain)

| Action | Who | On-chain | Backend records it only after verifying |
|---|---|---|---|
| **List for sale** | Owner | one-time `approve(marketplace, tokenId)` + `listItem(nft, tokenId, price)`: NFT moves into **escrow** | `ItemListed` from our marketplace, seller == caller's verified wallet, correct NFT, owner read via `ownerOf` |
| **Buy** | Anyone but the seller | `buyItem(listingId)` with exactly the price | `ItemSold` for **this** listing, buyer == caller's verified wallet |
| **Cancel** | Seller only | `cancelListing(listingId)`: NFT returns to the seller | `ListingCancelled` for this listing by the seller |
| **Transfer** | Owner | `safeTransferFrom(owner, to, tokenId)` | ERC-721 `Transfer` of this token from the caller's verified wallet |
| **Withdraw earnings** | Seller | `withdrawProceeds()` (pull payments) | nothing to record: the contract balance is the truth |

Protection against double purchases and unauthorized actions:
- **On-chain:** escrow, exact payment, `ListingNotActive`, `NotSeller`, `CannotBuyOwnListing`, reentrancy
  guard (Phase 5 tests).
- **In the app:** before paying, the buyer's browser re-reads `getListing()`; a sold or cancelled listing
  can't be bought.
- **In the backend:** status-conditional updates and unique indexes (one sale per listing, one active
  listing per NFT, one record per tx/event), and the acting wallet must be the caller's verified wallet.
- **Sync:** opening a listing or NFT page re-reads `getListing()`/`ownerOf()`. A sale or cancellation
  that was never reported is detected and the database corrected.

Pages: **Explore** (public; search, network filter, sort), **NFT page** `/nft/:id` (public; buy, list,
cancel, transfer, activity), **Activity** (your history), and earnings on the **Dashboard**.

### Testing the full flow locally
1. `npm run node` (contracts) is running, contracts deployed (`npm run deploy:local:reset` after any restart),
   `HARDHAT_MARKETPLACE_CONTRACT` set in `backend/.env`.
2. Import **two** Hardhat test accounts into MetaMask (e.g. Account #1 = seller, Account #2 = buyer) and
   link each to its own app user (`test1@…`, `test2@…`).
3. Seller: open an NFT → **List for sale** → approve + list. Buyer (other user, other account): Explore →
   NFT → **Buy now**. Seller: Dashboard → **Withdraw earnings**.

## 8. Admin (Phase 9)

Log in as an admin (create one with `npm run seed:admin` in `backend/`) → **Admin** in the navbar.

- **Dashboard** (`/admin`): registered users (+ new this week), NFTs, collections (distinct
  collection names), active and total listings, completed sales, sales volume, and recent platform
  activity, all from real data.
- **Users** (`/admin/users`): search by name/email/wallet, filter by role/status, per-user stats
  (minted / owned / sold). Action, with a confirmation: **Deactivate / Reactivate**.

Rules (enforced on the server, not just hidden in the UI):
- Every `/api/admin/*` route requires `authenticate` + `requireRole('ADMIN')`. Non-admins get 403,
  anonymous users 401. The role is read from the database on every request.
- **Roles can't be changed through the API or UI.** Admins are created only on the server with
  `npm run seed:admin` (or `npm run make-admin -- <email>`).
- Deactivated users are blocked on their very next request and can't log in.
- An admin can't deactivate their own account, and the last active admin can't be deactivated.
- Only `isActive` can be changed; role, email, password and wallet can't.

## 9. API

All responses: `{ success, message, data }`, or on error `{ success: false, message, errors? }`.

All responses: `{ success, message, data }`, or on error `{ success: false, message, errors? }`.

| Method | Endpoint             | Auth   | Body                          |
|--------|----------------------|--------|-------------------------------|
| GET    | `/api/health`        | –      | –                             |
| POST   | `/api/auth/register` | –      | `{ name, email, password }`   |
| POST   | `/api/auth/login`    | –      | `{ email, password }`         |
| GET    | `/api/auth/me`       | Bearer | –                             |
| GET    | `/api/users/me`      | Bearer | –                             |
| PATCH  | `/api/users/me`      | Bearer | `{ name?, bio? }`             |
| GET    | `/api/networks`      | –      | –                             |
| POST   | `/api/wallet/nonce`  | Bearer | `{ address, chainId }`        |
| POST   | `/api/wallet/verify` | Bearer | `{ nonce, signature }`        |
| DELETE | `/api/wallet`        | Bearer | –                             |
| GET    | `/api/ai/status`     | Bearer | –                             |
| POST   | `/api/ai/suggest`    | Bearer | `{ prompt, style? }`          |
| GET    | `/api/ai/generations?page&limit` | Bearer | –                 |
| POST   | `/api/ai/generations`| Bearer | multipart: `image` + `name, description, collectionName, style, attributes` (JSON) |
| GET    | `/api/ai/generations/:id` | Bearer | –                        |
| PATCH  | `/api/ai/generations/:id` | Bearer | `{ name?, description?, collectionName?, style?, attributes? }` |
| DELETE | `/api/ai/generations/:id` | Bearer | –                        |
| GET    | `/api/ai/ipfs/status`     | Bearer | –                        |
| POST   | `/api/ai/generations/:id/ipfs` | Bearer | – (start or retry; idempotent) |
| POST   | `/api/nfts/mint`     | Bearer | `{ generationId, chainId, txHash }`: 202 pending / 201 verified |
| GET    | `/api/nfts/mine?page&limit&chainId` | Bearer | – |
| GET    | `/api/nfts/:id`      | Bearer | – |
| POST   | `/api/nfts/:id/verify-owner` | Bearer | – (re-reads `ownerOf()` on-chain) |
| GET    | `/api/nfts/:id`      | –      | public NFT details (+ active listing, synced with chain) |
| GET    | `/api/nfts/:id/activity` | –  | public activity |
| POST   | `/api/nfts/:id/transfer` | Bearer | `{ txHash }` |
| GET    | `/api/marketplace/listings?page&limit&chainId&search&sort` | – | active listings |
| GET    | `/api/marketplace/listings/:id` | – | one listing (synced with chain) |
| POST   | `/api/marketplace/listings` | Bearer | `{ nftId, txHash }` |
| POST   | `/api/marketplace/listings/:id/buy` | Bearer | `{ txHash }` |
| POST   | `/api/marketplace/listings/:id/cancel` | Bearer | `{ txHash }` |
| GET    | `/api/users/me/transactions?page&limit&type` | Bearer | your history |
| GET    | `/api/admin/stats`   | Admin  | platform numbers |
| GET    | `/api/admin/activity?page&limit&type` | Admin | recent platform activity |
| GET    | `/api/admin/users?page&limit&search&role&status` | Admin | user list + stats |
| PATCH  | `/api/admin/users/:id` | Admin | `{ isActive }` (deactivate / reactivate only) |

Postman: import `docs/postman/api.postman_collection.json`. Register/Login store the token
automatically. Postman can't sign messages, so test the full wallet flow in the app or via `npm test`.

## Security notes

- Passwords are hashed with bcrypt (cost 12) and never returned by the API.
- JWTs are HS256 with the algorithm pinned; the user is re-loaded on every request, so deactivated
  accounts lose access immediately and roles always come from the database.
- Signup always creates `USER`; `role`, `email`, `walletAddress` cannot be set through the API.
- Login/register are rate-limited (20 per 15 min per IP); a global API limit applies too.
- The JWT is kept in `localStorage` (simple option chosen for this project). The trade-off: any
  XSS on the frontend could read it. React escapes output by default; avoid `dangerouslySetInnerHTML`.
- Wallet addresses are only stored after server-side signature verification with a single-use,
  expiring nonce. The app never asks for, sees or stores private keys or recovery phrases.

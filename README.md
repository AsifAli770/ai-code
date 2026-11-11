# AI-Powered Multi-Chain NFT Marketplace

Full-stack Web3 portfolio project: generate artwork with local AI, pin it to IPFS, mint ERC-721
NFTs and trade them on **Ethereum Sepolia** and **Base Sepolia**. Testnets only, no real funds.

| Folder       | Stack                                                       | Status   |
|--------------|-------------------------------------------------------------|----------|
| `backend/`   | Node 22, Express 5, MongoDB Atlas (Mongoose), JWT, bcrypt, ethers v6, multer | Phase 3 |
| `frontend/`  | React 19, Vite, Tailwind CSS v4, React Router, Axios, ethers v6              | Phase 3 |
| `contracts/` | Hardhat 3, Solidity, OpenZeppelin                           | Phase 5  |
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

## 6. API

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

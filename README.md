# Clarke

**The first on-chain market for geostationary orbital slot lease revenue.**

Satellite operators like SES and Eutelsat hold positions along geostationary orbit and earn $4.2B per year in transponder lease revenue under 15-year fixed contracts. Clarke tokenizes that yield on Solana. Operators raise upfront capital. Investors receive quarterly lease revenue directly to their wallet.

Live on Solana devnet: [clarkebelt.finance](https://clarkebelt.finance)

---

## What it does

- **Operators** submit a slot with a verified lease contract. Clarke structures an SPV. Tokens are minted on Solana.
- **Investors** buy fractional tokens representing a claim on quarterly transponder lease revenue.
- **Yield** is distributed on-chain each quarter. Token holders claim to any Solana wallet.

Three slots are live on devnet: `$ASTRA19` (19.2°E · SES), `$SES28` (28.2°E · SES), `$SATMEX101` (101°W · SES).

---

## On-chain program

- **Program ID:** `3KFUjEeu7efYuvLuAvEeKQqVt3pyoghUafoPSWzYif57` (Solana devnet)
- **Built with:** Anchor 0.29
- **Instructions:** `initialize`, `create_offering`, `invest`, `distribute_yield`, `claim_yield`, `pause_offering`, `close_offering`
- **Accounts:** `ProgramAuthority`, `SlotOffering`, `InvestorPosition`
- **Yield accounting:** reward-per-token accumulator pattern (O(1) distribution regardless of holder count)

Transactions are built without the Anchor runtime to avoid 0.29/0.32 IDL incompatibility. All instruction data is manually borsh-encoded using `DataView.setBigUint64` for browser compatibility.

---

## Stack

- **Frontend:** Next.js 16, Tailwind CSS, Manrope + IBM Plex Mono
- **Blockchain:** Solana devnet, Anchor 0.29, `@solana/web3.js`
- **Wallets:** Phantom, Solflare (via `@solana/wallet-adapter`)
- **Data:** Yahoo Finance (stock quotes + sparklines), ITU orbital registry

---

## Running locally

```bash
npm install
cp Anchor.toml.example Anchor.toml   # edit wallet path if needed
npm run dev
```

Requires a Solana wallet browser extension. Use the airdrop button or [faucet.solana.com](https://faucet.solana.com) to get devnet SOL.

### Seeding offerings

After deploying the program, seed the three slot offerings:

```bash
ANCHOR_WALLET=~/.config/solana/id.json \
CLARKE_TREASURY=<your-pubkey> \
npm run seed
```

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_URL` | Yes (prod) | Canonical URL, e.g. `https://clarkebelt.finance` |
| `NEXT_PUBLIC_RPC_URL` | No | Solana RPC endpoint (defaults to public devnet) |
| `NOTIFY_WEBHOOK_URL` | No | Webhook URL for form submissions (Discord, Slack, etc.) |

---

## License

MIT

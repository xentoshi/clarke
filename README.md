# Clarke

> **Under construction.** This project is actively being developed and is not production-ready.

**The data and intelligence layer for orbital infrastructure.**

Clarke normalizes public data across GEO, LEO, and MEO to build the orbital asset registry, pricing intelligence, and coordination layer the space economy is missing. The on-chain program is a proof of concept for tokenizing orbital asset revenue, running on Solana devnet.

---

![Clarke structure](./public/clarke-structure.svg)

## What it is

- **Orbital registry** — normalized database of orbital assets, operators, and estimated values built from ITU, FCC, Space-Track, UCS, and SEC public data
- **Company directory** — 50+ companies across the space infrastructure stack indexed by sector
- **Blog** — long-form writing on orbital infrastructure, space compute, and the space economy
- **Data sources** — documented public datasets Clarke normalizes
- **Devnet demo** — three GEO slots modeled on Solana devnet (`$ASTRA19`, `$SES28`, `$SATMEX101`) as a technical proof of concept

---

## On-chain program

- **Program ID:** `3KFUjEeu7efYuvLuAvEeKQqVt3pyoghUafoPSWzYif57` (Solana devnet)
- **Built with:** Anchor 0.29
- **Instructions:** `initialize`, `create_offering`, `invest`, `distribute_yield`, `claim_yield`, `set_offering_status`
- **Accounts:** `ProgramAuthority`, `SlotOffering`, `InvestorPosition`
- **Yield accounting:** reward-per-token accumulator pattern (O(1) distribution regardless of holder count)
- **Note:** positions are PDA-tracked, not SPL tokens — they do not appear in wallet UIs and are not transferable in this version

Transactions are built without the Anchor runtime to avoid 0.29/0.32 IDL incompatibility. All instruction data is manually borsh-encoded using `DataView.setBigUint64` for browser compatibility.

---

## Stack

- **Frontend:** Next.js 16, Tailwind CSS 4, Manrope + IBM Plex Mono
- **Blockchain:** Solana devnet, Anchor 0.29, `@solana/web3.js`
- **Wallets:** Phantom, Solflare (via `@solana/wallet-adapter`)
- **Data:** Yahoo Finance (stock quotes), ITU SNS, FCC IBFS, Space-Track, UCS Satellite Database, SEC EDGAR

---

## Running locally

```bash
npm install
cp Anchor.toml.example Anchor.toml
npm run dev
```

Requires a Solana wallet browser extension. Use the airdrop button in the nav or [faucet.solana.com](https://faucet.solana.com) to get devnet SOL.

### Seeding offerings

```bash
ANCHOR_WALLET=~/.config/solana/id.json \
CLARKE_TREASURY=<your-pubkey> \
npm run seed
```

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_URL` | Yes (prod) | Canonical URL |
| `NEXT_PUBLIC_RPC_URL` | No | Solana RPC endpoint (defaults to public devnet) |
| `NOTIFY_WEBHOOK_URL` | No | Webhook for form submissions |
| `BASIC_AUTH_USER` | No | Username for basic auth (omit to disable) |
| `BASIC_AUTH_PASS` | No | Password for basic auth (omit to disable) |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | No | Plausible analytics domain |

---

## License

MIT

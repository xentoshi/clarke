/**
 * Creates on-chain SlotOffering PDAs for each listed slot.
 * Run once after deploying the program:
 *
 *   ANCHOR_WALLET=~/.config/solana/id.json CLARKE_TREASURY=<pubkey> npx ts-node --project tsconfig.scripts.json scripts/seed-offerings.ts
 */

import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { createHash } from "crypto";
import * as fs from "fs";
import * as path from "path";

const PROGRAM_ID = new PublicKey("3KFUjEeu7efYuvLuAvEeKQqVt3pyoghUafoPSWzYif57");
const CLUSTER = process.env.ANCHOR_PROVIDER_URL ?? "https://api.devnet.solana.com";

const TREASURY_ENV = process.env.CLARKE_TREASURY;
if (!TREASURY_ENV) {
  console.error("Set CLARKE_TREASURY=<pubkey> before running this script.");
  process.exit(1);
}
const TREASURY = new PublicKey(TREASURY_ENV);

const LISTINGS = [
  { slotId: "19_2e",  longitudeX10:   192, ituRef: "LUX-19.2E-KU",  totalTokens: 1_000_000, tokenPriceLamports: 400_000, yieldShareBps: 8_000 },
  { slotId: "28_2e",  longitudeX10:   282, ituRef: "LUX-28.2E-KU",  totalTokens:   750_000, tokenPriceLamports: 400_000, yieldShareBps: 8_000 },
  { slotId: "101w",   longitudeX10: -1010, ituRef: "USA-101W-KU",   totalTokens:   500_000, tokenPriceLamports: 400_000, yieldShareBps: 8_000 },
];

// ── Borsh helpers ─────────────────────────────────────────────────────────────

function disc(name: string): Buffer {
  return Buffer.from(createHash("sha256").update(`global:${name}`).digest()).slice(0, 8);
}

function encStr(s: string): Buffer {
  const b = Buffer.from(s, "utf8");
  const len = Buffer.alloc(4); len.writeUInt32LE(b.length); return Buffer.concat([len, b]);
}
function encI32(n: number): Buffer { const b = Buffer.alloc(4); b.writeInt32LE(n); return b; }
function encU64(n: number): Buffer { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(n)); return b; }
function encU16(n: number): Buffer { const b = Buffer.alloc(2); b.writeUInt16LE(n); return b; }

// ── Send helper ───────────────────────────────────────────────────────────────

async function send(connection: Connection, keypair: Keypair, ix: TransactionInstruction): Promise<string> {
  const { blockhash } = await connection.getLatestBlockhash();
  const tx = new Transaction({ feePayer: keypair.publicKey, recentBlockhash: blockhash }).add(ix);
  tx.sign(keypair);
  const sig = await connection.sendRawTransaction(tx.serialize());
  await connection.confirmTransaction(sig, "confirmed");
  return sig;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const walletPath = process.env.ANCHOR_WALLET ?? `${process.env.HOME}/.config/solana/id.json`;
  const keypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(path.resolve(walletPath), "utf-8")))
  );
  const connection = new Connection(CLUSTER, "confirmed");

  const balance = await connection.getBalance(keypair.publicKey);
  console.log(`Admin:   ${keypair.publicKey.toBase58()}`);
  console.log(`Balance: ${(balance / 1e9).toFixed(3)} SOL\n`);

  const [authorityPda] = PublicKey.findProgramAddressSync([Buffer.from("authority")], PROGRAM_ID);

  // Initialize global authority (idempotent)
  const authorityAccount = await connection.getAccountInfo(authorityPda);
  if (!authorityAccount) {
    console.log("Initializing program authority…");
    const ix = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: keypair.publicKey, isSigner: true,  isWritable: true  },
        { pubkey: authorityPda,      isSigner: false, isWritable: true  },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: disc("initialize"),
    });
    const sig = await send(connection, keypair, ix);
    console.log(`✓ Authority initialized (${authorityPda.toBase58().slice(0, 12)}…)`);
    console.log(`  Tx: https://explorer.solana.com/tx/${sig}?cluster=devnet\n`);
  } else {
    console.log(`✓ Authority already exists (${authorityPda.toBase58().slice(0, 12)}…)\n`);
  }

  for (const l of LISTINGS) {
    const [offeringPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("offering"), Buffer.from(l.slotId)],
      PROGRAM_ID
    );

    const existing = await connection.getAccountInfo(offeringPda);
    if (existing) {
      console.log(`✓ ${l.slotId} already exists (${offeringPda.toBase58().slice(0, 12)}…)`);
      continue;
    }

    try {
      const data = Buffer.concat([
        disc("create_offering"),
        encStr(l.slotId),
        encI32(l.longitudeX10),
        encStr(l.ituRef),
        encU64(l.totalTokens),
        encU64(l.tokenPriceLamports),
        encU16(l.yieldShareBps),
      ]);

      const ix = new TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: keypair.publicKey,       isSigner: true,  isWritable: true  },
          { pubkey: authorityPda,            isSigner: false, isWritable: false },
          { pubkey: TREASURY,                isSigner: false, isWritable: false },
          { pubkey: offeringPda,             isSigner: false, isWritable: true  },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      const sig = await send(connection, keypair, ix);
      console.log(`✓ Created ${l.slotId}`);
      console.log(`  PDA:    ${offeringPda.toBase58()}`);
      console.log(`  Tokens: ${l.totalTokens.toLocaleString()} @ ${l.tokenPriceLamports} lamports`);
      console.log(`  Yield:  ${l.yieldShareBps / 100}% to holders`);
      console.log(`  Tx:     https://explorer.solana.com/tx/${sig}?cluster=devnet\n`);
    } catch (e) {
      console.error(`✗ Failed to create ${l.slotId}:`, e);
    }
  }

  console.log("Done.");
}

main().catch(console.error);

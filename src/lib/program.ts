import { BN } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey("3KFUjEeu7efYuvLuAvEeKQqVt3pyoghUafoPSWzYif57");

export function offeringPda(slotId: string): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("offering"), Buffer.from(slotId)],
    PROGRAM_ID
  )[0];
}

export function positionPda(investor: PublicKey, offering: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("position"), investor.toBuffer(), offering.toBuffer()],
    PROGRAM_ID
  )[0];
}

// ── Manual borsh decoders ─────────────────────────────────────────────────────

function readStr(data: Buffer, offset: number): { value: string; offset: number } {
  const len = data.readUInt32LE(offset);
  const value = data.slice(offset + 4, offset + 4 + len).toString("utf8");
  return { value, offset: offset + 4 + len };
}

function decodeOffering(pubkey: PublicKey, data: Buffer): OnChainOffering {
  let o = 8; // skip discriminator
  const admin   = new PublicKey(data.slice(o, o + 32)); o += 32; void admin;
  const treasury = new PublicKey(data.slice(o, o + 32)); o += 32;
  const slotId   = readStr(data, o); o = slotId.offset;
  const longitudeX10 = data.readInt32LE(o); o += 4;
  const ituRef   = readStr(data, o); o = ituRef.offset;
  const totalTokens        = new BN(data.slice(o, o + 8), "le"); o += 8;
  const tokenPriceLamports = new BN(data.slice(o, o + 8), "le"); o += 8;
  const soldTokens         = new BN(data.slice(o, o + 8), "le"); o += 8;
  const yieldShareBps      = data.readUInt16LE(o); o += 2;
  o += 16; // yield_per_token_acc u128 — not needed client-side
  const totalYieldDistributed = new BN(data.slice(o, o + 8), "le"); o += 8;
  const statusByte = data[o];
  const status = statusByte === 0 ? { active: {} } : statusByte === 1 ? { paused: {} } : { closed: {} };

  return {
    publicKey: pubkey,
    slotId: slotId.value,
    longitudeX10,
    ituRef: ituRef.value,
    totalTokens,
    tokenPriceLamports,
    soldTokens,
    yieldShareBps,
    totalYieldDistributed,
    status,
    treasury,
  };
}

function decodePosition(pubkey: PublicKey, data: Buffer): OnChainPosition {
  let o = 8; // skip discriminator
  const investor = new PublicKey(data.slice(o, o + 32)); o += 32;
  const offering = new PublicKey(data.slice(o, o + 32)); o += 32;
  const tokens            = new BN(data.slice(o, o + 8), "le"); o += 8;
  const investedLamports  = new BN(data.slice(o, o + 8), "le"); o += 8;
  o += 16; // yield_debt u128
  const yieldClaimable    = new BN(data.slice(o, o + 8), "le"); o += 8;
  const yieldClaimed      = new BN(data.slice(o, o + 8), "le");

  return { publicKey: pubkey, investor, offering, tokens, investedLamports, yieldClaimable, yieldClaimed };
}

// ── Public interfaces ─────────────────────────────────────────────────────────

export interface OnChainOffering {
  publicKey: PublicKey;
  slotId: string;
  longitudeX10: number;
  ituRef: string;
  totalTokens: BN;
  tokenPriceLamports: BN;
  soldTokens: BN;
  yieldShareBps: number;
  totalYieldDistributed: BN;
  status: { active?: object; paused?: object; closed?: object };
  treasury: PublicKey;
}

export interface OnChainPosition {
  publicKey: PublicKey;
  investor: PublicKey;
  offering: PublicKey;
  tokens: BN;
  investedLamports: BN;
  yieldClaimable: BN;
  yieldClaimed: BN;
}

// ── Fetch functions ───────────────────────────────────────────────────────────

export async function fetchOffering(
  connection: Connection,
  slotId: string
): Promise<OnChainOffering | null> {
  try {
    const pda = offeringPda(slotId);
    const info = await connection.getAccountInfo(pda);
    if (!info) return null;
    return decodeOffering(pda, info.data as Buffer);
  } catch {
    return null;
  }
}

// Seeded slot IDs — used to enumerate known offerings when fetching positions
const SEEDED_SLOT_IDS = ["19_2e", "28_2e", "101w"];

export async function fetchAllOfferings(
  connection: Connection
): Promise<OnChainOffering[]> {
  const results = await Promise.all(
    SEEDED_SLOT_IDS.map((id) => fetchOffering(connection, id))
  );
  return results.filter((o): o is OnChainOffering => o !== null);
}

export async function fetchAllPositions(
  connection: Connection,
  investor: PublicKey
): Promise<OnChainPosition[]> {
  const offerings = await fetchAllOfferings(connection);
  const results = await Promise.all(
    offerings.map((o) => fetchPosition(connection, investor, o.publicKey))
  );
  return results.filter((p): p is OnChainPosition => p !== null && p.tokens.toNumber() > 0);
}

export async function fetchPosition(
  connection: Connection,
  investor: PublicKey,
  offeringPubkey: PublicKey
): Promise<OnChainPosition | null> {
  try {
    const pda = positionPda(investor, offeringPubkey);
    const info = await connection.getAccountInfo(pda);
    if (!info) return null;
    return decodePosition(pda, info.data as Buffer);
  } catch {
    return null;
  }
}

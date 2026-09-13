// POST { walletAddress: string, streak: number } -> { signature, explorerUrl, mint }
// Mints 1 unit of a fixed devnet SPL token ("streak badge") to the caller's
// wallet. Mint authority key stays server-side, same pattern as coach.ts/
// tts.ts/stt.ts. Devnet only — see CLAUDE.md: stretch, isolated, never on
// the critical path.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";

const MIN_STREAK_FOR_BADGE = 3;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const authoritySecret = process.env.SOLANA_MINT_AUTHORITY_SECRET;
  const mintAddress = process.env.SOLANA_BADGE_MINT;
  if (!authoritySecret || !mintAddress) {
    return res.status(500).json({ error: "Solana badge not configured" });
  }

  const { walletAddress, streak } = req.body ?? {};
  if (typeof walletAddress !== "string" || !walletAddress.trim()) {
    return res.status(400).json({ error: "walletAddress (string) is required" });
  }
  if (typeof streak !== "number" || streak < MIN_STREAK_FOR_BADGE) {
    return res.status(400).json({ error: `streak must be a number >= ${MIN_STREAK_FOR_BADGE}` });
  }

  let destination: PublicKey;
  try {
    destination = new PublicKey(walletAddress);
  } catch {
    return res.status(400).json({ error: "walletAddress is not a valid Solana address" });
  }

  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  // SOLANA_MINT_AUTHORITY_SECRET is a JSON array of 64 numbers (the same
  // format Solana CLI keypair files use) rather than base58 — bs58@6 is
  // ESM-only and Vercel's Node function bundler can't require() it,
  // which crashed this function entirely before this was caught.
  const authority = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(authoritySecret)));
  const mint = new PublicKey(mintAddress);

  try {
    const ata = await getOrCreateAssociatedTokenAccount(connection, authority, mint, destination);
    const signature = await mintTo(connection, authority, mint, ata.address, authority, 1);

    return res.status(200).json({
      signature,
      explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
      mint: mint.toBase58(),
    });
  } catch (error) {
    return res.status(502).json({ error: "Mint failed", detail: String(error) });
  }
}

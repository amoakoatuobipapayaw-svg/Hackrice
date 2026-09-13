// solanaBadge.ts — Phantom wallet connect + streak badge claim. Devnet only,
// fully isolated per CLAUDE.md: nothing else in the app imports from here,
// and this module never blocks the core sign -> recognize -> coach loop.
export const MIN_STREAK_FOR_BADGE = 3;

type PhantomProvider = {
  isPhantom?: boolean;
  connect(): Promise<{ publicKey: { toString(): string } }>;
};

declare global {
  interface Window {
    solana?: PhantomProvider;
  }
}

export function isPhantomAvailable(): boolean {
  return typeof window !== "undefined" && Boolean(window.solana?.isPhantom);
}

export async function connectPhantomWallet(): Promise<string> {
  if (!window.solana) throw new Error("Phantom wallet not found — install it from phantom.app");
  const { publicKey } = await window.solana.connect();
  return publicKey.toString();
}

export type BadgeClaim = { signature: string; explorerUrl: string; mint: string };

export async function claimStreakBadge(walletAddress: string, streak: number): Promise<BadgeClaim> {
  const res = await fetch("/api/solanaBadge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress, streak }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? `Badge claim failed (${res.status})`);
  return body as BadgeClaim;
}

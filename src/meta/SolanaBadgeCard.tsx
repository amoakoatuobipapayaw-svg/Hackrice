// Optional streak-milestone card. Isolated: only mounted when a profile
// already qualifies (see Home.tsx), degrades to an "install Phantom" link
// rather than breaking anything if the wallet extension isn't present.
import { useState } from "react";
import { claimStreakBadge, connectPhantomWallet, isPhantomAvailable, type BadgeClaim } from "./solanaBadge";

export function SolanaBadgeCard({ streak }: { streak: number }) {
  const [wallet, setWallet] = useState<string | null>(null);
  const [claim, setClaim] = useState<BadgeClaim | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleConnect() {
    setError(null);
    try {
      setWallet(await connectPhantomWallet());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not connect wallet");
    }
  }

  async function handleClaim() {
    if (!wallet) return;
    setError(null);
    setBusy(true);
    try {
      setClaim(await claimStreakBadge(wallet, streak));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not mint badge");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border-2 border-line bg-surface p-5">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="text-2xl">🪙</span>
        <h2 className="text-lg font-extrabold">Streak badge (devnet)</h2>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {claim
          ? "Minted! An on-chain record of your streak, on Solana devnet."
          : `${streak}-day streak unlocked a badge — mint it as a devnet on-chain achievement.`}
      </p>

      {claim && (
        <a href={claim.explorerUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-extrabold text-brand underline">
          View transaction on Solana Explorer →
        </a>
      )}

      {!claim && !isPhantomAvailable() && (
        <a href="https://phantom.app" target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-extrabold text-brand underline">
          Install Phantom to claim
        </a>
      )}

      {!claim && isPhantomAvailable() && !wallet && (
        <button type="button" onClick={handleConnect} className="mt-3 rounded-lg border-2 border-line px-4 py-2 text-sm font-extrabold hover:bg-soft">
          Connect wallet
        </button>
      )}

      {!claim && wallet && (
        <button type="button" disabled={busy} onClick={handleClaim} className="mt-3 rounded-lg border-2 border-line px-4 py-2 text-sm font-extrabold hover:bg-soft disabled:opacity-50">
          {busy ? "Minting…" : "Claim badge"}
        </button>
      )}

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </section>
  );
}

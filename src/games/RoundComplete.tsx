// Shared end-of-round summary for all three modes: XP earned, updated
// totals, and a way to go again or check the leaderboard.
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import type { RoundResult, UserProfile } from "../lib/contracts";

type RoundCompleteProps = {
  result: RoundResult;
  profile: UserProfile;
  onRetry: () => void;
};

export function RoundComplete({ result, profile, onRetry }: RoundCompleteProps) {
  return (
    <Card className="mx-auto max-w-md text-center">
      <h2 className="text-xl font-bold">Round complete!</h2>
      <p className="mt-2 text-slate-300">
        {result.correct} / {result.total} correct — +{result.xp} XP
      </p>
      <p className="mt-1 text-sm text-slate-400">
        Level {profile.level} · {profile.xp} XP total · 🔥 {profile.streak} day streak
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button onClick={onRetry}>Do it again</Button>
        <Link to="/leaderboard">
          <Button variant="secondary">View leaderboard</Button>
        </Link>
      </div>
    </Card>
  );
}

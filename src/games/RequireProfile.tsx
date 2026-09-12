// Every mode needs a local profile to award XP to. Shared gate so the
// "tell us your name" nudge reads identically across Lesson/Speed/Math.
import { Link } from "react-router-dom";

export function RequireProfile({ mode }: { mode: string }) {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="text-slate-300">
        <Link to="/onboarding" className="text-violet-400 underline">
          Tell us your name
        </Link>{" "}
        before starting {mode}.
      </p>
    </div>
  );
}

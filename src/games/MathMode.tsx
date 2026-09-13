// /math is the Math Lab. With no ?game= param it shows the hub (nine game
// panels); with ?game=<id> it plays that game. A query param rather than a
// nested route keeps every change inside src/games/ — App.tsx is untouched.
import { useSearchParams } from "react-router-dom";
import { findGame } from "./math/games";
import { MathGame } from "./math/MathGame";
import { MathHub } from "./math/MathHub";

export function MathMode() {
  const [searchParams] = useSearchParams();
  const game = findGame(searchParams.get("game"));
  // Keyed so switching games remounts the engine with fresh state.
  return game ? <MathGame key={game.id} game={game} /> : <MathHub />;
}

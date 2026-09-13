// /lesson is the levelled Practice mode. With no params it shows the
// Practice home — the get-ready card plus the level map; with ?level=<n> it
// plays that level on its own page. A query param rather than nested routes
// keeps every change inside src/games/, so App.tsx is untouched (the same
// approach MathMode.tsx takes for the Math Lab).
//
// ?unit=<id> links from Home's Roadmap still work: a unit resolves to the
// smallest level whose pool contains it (see levelForSigns).
import { Navigate, useSearchParams } from "react-router-dom";
import { findUnit } from "./signCatalog";
import { findLevel, levelForSigns, levelHref } from "./practice/levels";
import { isLevelUnlocked } from "./practice/practiceProgress";
import { LevelLocked } from "./practice/LevelLocked";
import { PracticeHub } from "./practice/PracticeHub";
import { PracticeLevel } from "./practice/PracticeLevel";

export function Lesson() {
  const [searchParams] = useSearchParams();
  const level = findLevel(searchParams.get("level"));
  const unit = findUnit(searchParams.get("unit"));

  if (level) {
    if (!isLevelUnlocked(level.number)) return <LevelLocked level={level} />;
    // Keyed so moving between levels remounts with fresh round state.
    return <PracticeLevel key={level.number} level={level} />;
  }

  if (unit && unit.kind !== "content") {
    const match = levelForSigns(unit.signs);
    if (match) return <Navigate to={levelHref(match)} replace />;
  }

  return <PracticeHub />;
}

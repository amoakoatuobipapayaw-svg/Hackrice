import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { Home } from "./Home";
import { Nav } from "./Nav";
import { Onboarding } from "./Onboarding";
import { Lesson } from "../games/Lesson";
import { MathMode } from "../games/MathMode";
import { SpeedChallenge } from "../games/SpeedChallenge";
import { recordActivity } from "../lib/activityLog";
import { Leaderboard } from "../meta/Leaderboard";

function App() {
  // Every visit marks today on the streak calendar (see lib/activityLog.ts).
  useEffect(() => {
    recordActivity();
  }, []);

  return (
    <div className="min-h-full">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <Nav />
      <main id="main-content" tabIndex={-1} className="lg:pl-60">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/lesson" element={<Lesson />} />
          <Route path="/speed" element={<SpeedChallenge />} />
          <Route path="/math" element={<MathMode />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

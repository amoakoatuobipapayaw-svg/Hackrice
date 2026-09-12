import { Route, Routes } from "react-router-dom";
import { Home } from "./Home";
import { Nav } from "./Nav";
import { Onboarding } from "./Onboarding";
import { Lesson } from "../games/Lesson";
import { MathMode } from "../games/MathMode";
import { SpeedChallenge } from "../games/SpeedChallenge";
import { Leaderboard } from "../meta/Leaderboard";

function App() {
  return (
    <div className="min-h-full">
      <Nav />
      <main>
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

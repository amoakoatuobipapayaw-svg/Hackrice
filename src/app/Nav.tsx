import { NavLink } from "react-router-dom";
import { NAME } from "../lib/constants";
import { HighContrastToggle } from "../components/ui/HighContrastToggle";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/lesson", label: "Lesson" },
  { to: "/speed", label: "Speed" },
  { to: "/math", label: "Math" },
  { to: "/leaderboard", label: "Leaderboard" },
];

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-violet-500 text-white" : "text-slate-300 hover:bg-slate-800"
  }`;

export function Nav() {
  return (
    <header className="border-b border-slate-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <NavLink to="/" className="text-lg font-bold text-slate-100">
          {NAME}
        </NavLink>
        <nav className="flex items-center gap-1">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClasses}>
              {link.label}
            </NavLink>
          ))}
          <HighContrastToggle />
        </nav>
      </div>
    </header>
  );
}

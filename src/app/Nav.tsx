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
    isActive ? "bg-brand text-white" : "text-muted hover:bg-soft"
  }`;

export function Nav() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <NavLink to="/" className="text-lg font-bold text-ink">
          {NAME}
        </NavLink>
        <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-1">
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

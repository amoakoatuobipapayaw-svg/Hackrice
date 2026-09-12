import { NavLink } from 'react-router-dom';
import { HighContrastToggle } from '../components/ui/HighContrastToggle';

const LINKS = [
  { to: '/', label: 'Learn', icon: '⌂' },
  { to: '/lesson', label: 'Practice', icon: '✋' },
  { to: '/speed', label: 'Speed', icon: 'ϟ' },
  { to: '/math', label: 'Math', icon: '＋' },
  { to: '/leaderboard', label: 'Leaderboard', icon: '♜' },
];

export function Nav() {
  return <header className="border-b-2 border-line bg-surface lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:w-56 lg:border-r-2 lg:border-b-0">
    <div className="flex h-full flex-col p-3 lg:p-4">
      <div className="flex items-center justify-between lg:block">
        <NavLink to="/" className="inline-flex items-center gap-2 px-2 py-3 text-2xl font-extrabold tracking-tight text-brand lg:mb-6 lg:py-5"><span aria-hidden="true" className="text-3xl">✋</span>signquest</NavLink>
        <div className="lg:hidden"><HighContrastToggle /></div>
      </div>
      <nav aria-label="Main navigation" className="grid grid-cols-5 gap-1 lg:flex lg:flex-col lg:gap-2">
        {LINKS.map(({to,label,icon}) => <NavLink key={to} to={to} end={to === '/'} className={({isActive}) => `flex min-w-0 flex-col items-center gap-1 rounded-xl border-2 px-1 py-2 text-[10px] font-extrabold tracking-wide uppercase lg:flex-row lg:gap-4 lg:px-4 lg:py-3 lg:text-sm ${isActive ? 'border-selected-line bg-selected text-selected-ink' : 'border-transparent text-muted hover:bg-soft'}`}><span aria-hidden="true" className="text-2xl leading-none lg:w-7 lg:text-center">{icon}</span><span>{label}</span></NavLink>)}
      </nav>
      <div className="mt-auto hidden border-t-2 border-line pt-4 lg:block"><p className="mb-3 px-2 text-xs leading-relaxed text-muted">A little practice.<br />A world of connection.</p><HighContrastToggle /></div>
    </div>
  </header>;
}

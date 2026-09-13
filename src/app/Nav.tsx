import { NavLink } from 'react-router-dom';
import { HighContrastToggle } from '../components/ui/HighContrastToggle';
import { Icon, type IconName } from '../components/ui/Icon';
import { Logo } from '../components/ui/Logo';
import { TtsToggle } from '../components/ui/TtsToggle';
import { GoogleSignInButton } from './GoogleSignInButton';
import { VerifyBadge } from './VerifyBadge';

const LINKS: Array<{ to: string; label: string; icon: IconName }> = [
  { to: '/', label: 'Learn', icon: 'home' },
  { to: '/lesson', label: 'Practice', icon: 'hand' },
  { to: '/speed', label: 'Speed', icon: 'zap' },
  { to: '/math', label: 'Math', icon: 'plus' },
  { to: '/dictionary', label: 'Dictionary', icon: 'video' },
  { to: '/leaderboard', label: 'Leaderboard', icon: 'trophy' },
];

export function Nav() {
  return <header className="border-b-2 border-line bg-surface lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:w-60 lg:border-r-2 lg:border-b-0">
    <div className="flex h-full flex-col p-3 lg:p-4">
      <div className="flex items-center justify-between lg:block">
        <NavLink to="/" className="inline-flex rounded-xl px-2 py-3 lg:mb-0 lg:py-4" aria-label="Home"><Logo /></NavLink>
        <div className="flex items-center gap-1 lg:hidden"><GoogleSignInButton compact /><VerifyBadge compact /><TtsToggle /><HighContrastToggle /></div>
      </div>
      <div className="hidden lg:mb-6 lg:block lg:space-y-2"><GoogleSignInButton /><VerifyBadge /></div>
      <nav aria-label="Main navigation" className="grid grid-cols-6 gap-1 lg:flex lg:flex-col lg:gap-1.5">
        {LINKS.map(({to,label,icon}) => <NavLink key={to} to={to} end={to === '/'} className={({isActive}) => `flex min-w-0 flex-col items-center gap-1 rounded-xl border-2 px-1 py-2 text-[10px] font-extrabold tracking-wide uppercase transition-colors lg:flex-row lg:gap-3 lg:px-3.5 lg:py-3 lg:text-sm ${isActive ? 'border-selected-line bg-selected text-selected-ink' : 'border-transparent text-muted hover:bg-soft hover:text-ink'}`}><Icon name={icon} size={22} className="lg:w-6" /><span className="truncate">{label}</span></NavLink>)}
      </nav>
      <div className="mt-auto hidden border-t-2 border-line pt-4 lg:block"><p className="mb-3 px-2 text-xs leading-relaxed text-muted">A little practice.<br />A world of connection.</p><div className="flex flex-col gap-1"><TtsToggle /><HighContrastToggle /></div></div>
    </div>
  </header>;
}

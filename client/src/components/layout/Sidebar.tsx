import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Mail,
  CheckSquare,
  Mic,
  Search,
  Newspaper,
  Briefcase,
  Settings,
  X
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/chat', label: 'Chat', icon: MessageSquare },
  { path: '/email', label: 'Email Drafter', icon: Mail },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare },
  { path: '/meetings', label: 'Meetings', icon: Mic },
  { path: '/research', label: 'Research', icon: Search },
  { path: '/news', label: 'News', icon: Newspaper },
  { path: '/ba-tools', label: 'BA Tools', icon: Briefcase },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <>
      {/* Mobile: fixed drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-surface border-r border-border flex flex-col transform transition-transform duration-300 md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gradient">Tanya's PA</h1>
            <p className="text-xs text-text-muted korean-accent mt-1">보라해 💜</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-surface-hover rounded-lg text-text-muted">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-bts-purple text-white shadow-lg'
                    : 'text-text-muted hover:bg-surface-hover hover:text-text'
                }`
              }
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border text-center text-xs text-text-muted">
          BTS Toronto Concert
        </div>
      </aside>

      {/* Desktop: static sidebar */}
      <aside className="hidden md:flex w-64 bg-surface border-r border-border min-h-screen flex-col flex-shrink-0">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-gradient">Tanya's PA</h1>
          <p className="text-xs text-text-muted korean-accent mt-1">보라해 💜</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-bts-purple text-white shadow-lg'
                    : 'text-text-muted hover:bg-surface-hover hover:text-text'
                }`
              }
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border text-center text-xs text-text-muted">
          BTS Toronto Concert
        </div>
      </aside>
    </>
  );
}

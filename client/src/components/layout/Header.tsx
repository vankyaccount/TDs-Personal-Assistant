import { useAuthStore } from '../../stores/authStore';
import { LogOut, User } from 'lucide-react';

export default function Header() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6">
      <div>
        <h2 className="text-lg font-semibold text-text">Welcome back, {user?.name || 'User'}</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <User size={18} />
          <span>{user?.email}</span>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 hover:bg-surface-hover rounded-lg transition-colors text-text-muted hover:text-text"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}

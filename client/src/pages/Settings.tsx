import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';

export default function Settings() {
  const user = useAuthStore((s) => s.user);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-2xl font-bold text-gradient">Settings</h1>

      <div className="card">
        <h2 className="text-lg font-semibold text-text mb-4">Profile</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-text-muted mb-1">Name</label>
            <p className="text-text">{user?.name}</p>
          </div>
          <div>
            <label className="block text-sm text-text-muted mb-1">Email</label>
            <p className="text-text">{user?.email}</p>
          </div>
          <div>
            <label className="block text-sm text-text-muted mb-1">Role</label>
            <p className="text-text capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-text mb-4">App Info</h2>
        <p className="text-sm text-text-muted">
          Tanya's PA v1.0 — BTS-themed Personal Assistant
        </p>
        <p className="text-xs text-text-muted mt-2">
          Built with React + Express + PostgreSQL
        </p>
      </div>
    </motion.div>
  );
}

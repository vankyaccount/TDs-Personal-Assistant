import CountdownTimer from '../bts/CountdownTimer';
import MemberSelector from '../bts/MemberSelector';

export default function RightRail() {
  return (
    <aside className="w-80 bg-gradient-to-b from-[#1a0a35] to-[#0f0520] border-l border-lavender/30 min-h-screen flex flex-col">
      {/* Countdown Timer */}
      <div className="p-4 border-b border-border">
        <CountdownTimer />
      </div>

      {/* Member Selector */}
      <div className="p-4 border-b border-border">
        <MemberSelector />
      </div>

      {/* Quick Stats */}
      <div className="p-4 flex-1">
        <h3 className="text-sm font-semibold text-text-muted mb-3">Quick Stats</h3>
        <div className="space-y-2">
          <div className="bg-surface rounded-lg p-3 border border-border">
            <p className="text-xs text-text-muted">Today</p>
            <p className="text-lg font-bold text-gold">New day, new opportunity!</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

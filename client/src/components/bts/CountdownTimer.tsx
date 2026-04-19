import { useState, useEffect } from 'react';

const CONCERT_DATE = new Date('2026-08-23T20:00:00-05:00'); // Aug 23, 2026 8PM EST (Toronto)

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const distance = CONCERT_DATE.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-surface rounded-lg p-4 border border-bts-purple/30 animate-pulseGlow">
      <h3 className="text-center text-sm font-semibold text-gold mb-3">BTS Toronto Concert</h3>
      <p className="text-center text-xs text-text-muted mb-3">August 23, 2026 • 8:00 PM EST</p>

      <div className="grid grid-cols-4 gap-2 text-center">
        {Object.entries(timeLeft).map(([unit, value]) => (
          <div key={unit} className="bg-bts-purple/40 rounded-lg p-2 border border-bts-purple/60">
            <div className="text-xl font-bold text-gold">{String(value).padStart(2, '0')}</div>
            <div className="text-xs text-lavender capitalize">{unit}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

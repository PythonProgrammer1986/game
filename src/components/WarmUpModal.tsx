import React, { useState, useEffect } from 'react';
import { Flame, CheckCircle, Zap, ArrowRight, X } from 'lucide-react';

interface WarmUpModalProps {
  onComplete: () => void;
  onClose: () => void;
  jumpCount: number;
  lastJumpIntensity: number;
}

export const WarmUpModal: React.FC<WarmUpModalProps> = ({
  onComplete,
  onClose,
  jumpCount,
  lastJumpIntensity,
}) => {
  const [initialCount] = useState<number>(jumpCount);
  const hopsCompleted = Math.min(3, Math.max(0, jumpCount - initialCount));

  useEffect(() => {
    if (hopsCompleted >= 3) {
      const timer = setTimeout(() => {
        onComplete();
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [hopsCompleted, onComplete]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-cyan-500/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-500/20 text-center">
        {/* Close / Skip button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          title="Skip Warm-Up"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-xs font-bold mb-3 uppercase tracking-wider">
          <Zap className="w-4 h-4 text-cyan-400" />
          10-Second Leap Calibration
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight mb-2">
          WARM-UP TEST HOPS
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mb-6">
          Do <span className="text-emerald-400 font-semibold">3 physical hops</span> in front of the camera so we can dial in your jump arc!
        </p>

        {/* 3 Step Progress Circles */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {[1, 2, 3].map((step) => {
            const isDone = hopsCompleted >= step;
            const isCurrent = hopsCompleted === step - 1;
            return (
              <div key={step} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${
                    isDone
                      ? 'border-emerald-400 bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/20'
                      : isCurrent
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 animate-pulse'
                      : 'border-slate-800 bg-slate-950 text-slate-600'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle className="w-7 h-7 text-emerald-400" />
                  ) : (
                    <Flame className={`w-6 h-6 ${isCurrent ? 'text-cyan-400' : 'text-slate-700'}`} />
                  )}
                </div>
                <span className="text-[10px] font-mono-num uppercase text-slate-400 font-bold">
                  Hop #{step}
                </span>
              </div>
            );
          })}
        </div>

        {/* Live Feedback */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 mb-6 text-xs">
          {hopsCompleted === 0 && (
            <p className="text-slate-300">
              Stand so your upper body is centered in the camera. Now do a quick hop!
            </p>
          )}
          {hopsCompleted === 1 && (
            <p className="text-emerald-300 font-semibold">
              Hop 1 detected! Leap intensity: {Math.round(lastJumpIntensity * 100)}%. Great! Do hop 2!
            </p>
          )}
          {hopsCompleted === 2 && (
            <p className="text-emerald-300 font-semibold">
              Hop 2 detected! Almost there — one final energetic jump!
            </p>
          )}
          {hopsCompleted >= 3 && (
            <p className="text-cyan-300 font-bold animate-bounce">
              Calibration complete! Your jump arc is dialed in!
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            Skip Warm-up
          </button>
          <button
            onClick={onComplete}
            disabled={hopsCompleted < 3}
            className={`flex-1 py-3 text-xs font-pixel font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
              hopsCompleted >= 3
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            START RUN <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

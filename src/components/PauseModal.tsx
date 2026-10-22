import React from 'react';
import { Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  sensitivity: 'low' | 'normal' | 'high' | 'extreme';
  onSetSensitivity: (s: 'low' | 'normal' | 'high' | 'extreme') => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  isMuted,
  onToggleMute,
  sensitivity,
  onSetSensitivity,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md select-none animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
        <h2 className="text-2xl font-bold font-heading text-white mb-6 tracking-wide">
          GAME PAUSED
        </h2>

        <div className="flex flex-col gap-3 mb-6">
          <button
            onClick={onResume}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-pixel text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            RESUME (ESC)
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-pixel text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            RESTART
          </button>
        </div>

        {/* Quick Settings */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Audio:</span>
          <button
            onClick={onToggleMute}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isMuted ? 'Muted' : 'Sound On'}</span>
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <span>Sensitivity:</span>
          <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
            {(['low', 'normal', 'high', 'extreme'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => onSetSensitivity(lvl)}
                className={`px-2 py-0.5 text-[10px] font-medium rounded capitalize transition ${
                  sensitivity === lvl
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

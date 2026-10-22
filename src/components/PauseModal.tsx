import React from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Gauge, Lock, Unlock } from 'lucide-react';
import { GameSpeed, SPEED_PRESETS } from '../game/types';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  sensitivity: 'low' | 'normal' | 'high' | 'extreme';
  onSetSensitivity: (s: 'low' | 'normal' | 'high' | 'extreme') => void;
  speedSetting: GameSpeed;
  onSetSpeed: (speed: GameSpeed) => void;
  lockSpeed: boolean;
  onToggleLockSpeed: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  isMuted,
  onToggleMute,
  sensitivity,
  onSetSensitivity,
  speedSetting,
  onSetSpeed,
  lockSpeed,
  onToggleLockSpeed,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md select-none animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-2xl text-center">
        <h2 className="text-2xl font-bold font-heading text-white mb-4 tracking-wide">
          GAME PAUSED
        </h2>

        <div className="flex flex-col gap-2.5 mb-5">
          <button
            onClick={onResume}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-pixel text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            RESUME (ESC / TAP)
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-pixel text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            RESTART
          </button>
        </div>

        {/* Speed Controller for Parent / Kid */}
        <div className="pt-3 pb-3 border-t border-b border-slate-800 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              Game Speed (Kid Pace):
            </span>
            <button
              onClick={onToggleLockSpeed}
              className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                lockSpeed
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                  : 'bg-slate-800 text-slate-400'
              }`}
              title="Lock speed so it never speeds up"
            >
              {lockSpeed ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
              <span>{lockSpeed ? 'Constant Speed' : 'Accelerating'}</span>
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1 mb-1.5">
            {(['gentle', 'normal', 'fast', 'turbo'] as GameSpeed[]).map((spd) => {
              const preset = SPEED_PRESETS[spd];
              const isSel = speedSetting === spd;
              return (
                <button
                  key={spd}
                  onClick={() => onSetSpeed(spd)}
                  className={`py-1 px-1 rounded-lg text-center transition ${
                    isSel
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <div className="text-sm">{preset.icon}</div>
                  <div className="text-[9px] truncate">{preset.label.split(' ')[0]}</div>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            {SPEED_PRESETS[speedSetting]?.description}
          </p>
        </div>

        {/* Sensitivity & Audio */}
        <div className="pt-3 flex items-center justify-between text-xs text-slate-400">
          <span>Sound:</span>
          <button
            onClick={onToggleMute}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isMuted ? 'Muted' : 'Sound On'}</span>
          </button>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
          <span>Jump Sensitivity:</span>
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

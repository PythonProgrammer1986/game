import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Flame, Footprints, Sparkles, Trophy, Award, Zap, HeartPulse } from 'lucide-react';
import { WorkoutReport } from '../game/types';

interface GameOverModalProps {
  report: WorkoutReport | null;
  highScore: number;
  isNewHighScore: boolean;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  report,
  highScore,
  isNewHighScore,
  onRestart,
}) => {
  useEffect(() => {
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#f59e0b', '#ec4899', '#f43f5e'],
      });
    } catch {
      // Safe fallback
    }
  }, []);

  const score = report?.score || 0;
  const jumps = report?.totalPhysicalJumps || 0;
  const calories = report?.caloriesBurned || 0;
  const distance = report?.distanceMeters || 0;
  const babyDinos = report?.babyDinosHatched || 0;
  const freezePassed = report?.freezeChallengesPassed || 0;
  const award = report?.awardBadge || {
    title: 'Super Dino Explorer',
    description: 'Great active effort and super high leaps!',
    icon: '🦖',
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border-2 border-emerald-500/70 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-emerald-500/20 text-center relative overflow-hidden">
        {/* Certificate Golden Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400" />

        {/* Award Badge Header */}
        <div className="my-2 p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 via-emerald-500/15 to-cyan-500/20 border border-amber-400/50 shadow-inner">
          <div className="text-4xl mb-1 animate-bounce">{award.icon}</div>
          <div className="text-xs font-mono font-bold text-amber-300 uppercase tracking-widest">
            OFFICIAL DINO EXPLORER AWARD
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold font-heading text-white tracking-tight">
            {award.title}
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">{award.description}</p>
        </div>

        {/* Score & Record */}
        <div className="my-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-0.5">
            TOTAL SCORE
          </div>
          <div className="text-3xl sm:text-4xl font-pixel font-bold text-emerald-400 tracking-wider">
            {String(score).padStart(5, '0')}
          </div>
          <div className="mt-1 text-[11px] font-mono-num text-slate-400 flex items-center justify-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Family Best Record: {highScore}</span>
          </div>
        </div>

        {/* Kids Active Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-center gap-1 text-amber-400 mb-0.5">
              <Flame className="w-3.5 h-3.5" />
            </div>
            <div className="text-base font-bold font-mono-num text-white">{jumps}</div>
            <div className="text-[9px] text-slate-400 uppercase">Hops & Jumps</div>
          </div>

          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-center gap-1 text-emerald-400 mb-0.5">
              <span>🐣</span>
            </div>
            <div className="text-base font-bold font-mono-num text-white">{babyDinos}</div>
            <div className="text-[9px] text-slate-400 uppercase">Babies Hatched</div>
          </div>

          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-center gap-1 text-cyan-400 mb-0.5">
              <span>❄️</span>
            </div>
            <div className="text-base font-bold font-mono-num text-white">{freezePassed}</div>
            <div className="text-[9px] text-slate-400 uppercase">Statues Made</div>
          </div>

          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-center gap-1 text-rose-400 mb-0.5">
              <Footprints className="w-3.5 h-3.5" />
            </div>
            <div className="text-base font-bold font-mono-num text-white">{Math.floor(distance)}m</div>
            <div className="text-[9px] text-slate-400 uppercase">Sprint Distance</div>
          </div>
        </div>

        {/* Restart CTA */}
        <button
          onClick={onRestart}
          className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-pixel text-xs sm:text-sm font-bold rounded-2xl shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          PLAY AGAIN TOGETHER (SPACE)
        </button>

        <p className="mt-2 text-[10px] font-mono-num text-slate-400">
          Jump in front of the camera or press Space to start the next adventure!
        </p>
      </div>
    </div>
  );
};

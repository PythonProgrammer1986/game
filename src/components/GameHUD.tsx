import React from 'react';
import { Volume2, VolumeX, Pause, Flame, Sparkles, Footprints, ShieldAlert, Zap, Shield, Wind, Magnet, Heart, Mic, MicOff, BatteryCharging, Home } from 'lucide-react';
import { ActivePowerUp, BabyDino, BiomeType, GameMode, GameState, PowerUpType } from '../game/types';

interface GameHUDProps {
  score: number;
  highScore: number;
  distanceMeters: number;
  physicalJumps: number;
  caloriesBurned: number;
  eggsCollected: number;
  currentSpeed: number;
  isMuted: boolean;
  gameState: GameState;
  jumpFlash: boolean;
  isDucking: boolean;
  roarReady: boolean;
  currentBiome: BiomeType;
  mode: GameMode;
  gameTime: number;
  lives: number;
  maxLives: number;
  dinoBattery: number;
  babyDinos: BabyDino[];
  voiceEnabled: boolean;
  activePowerUps: Map<PowerUpType, ActivePowerUp>;
  onToggleMute: () => void;
  onToggleVoice: () => void;
  onPause: () => void;
  onHome?: () => void;
  onTriggerRoar?: () => void;
  onTriggerStomp?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  highScore,
  distanceMeters,
  physicalJumps,
  caloriesBurned,
  eggsCollected,
  currentSpeed,
  isMuted,
  gameState,
  jumpFlash,
  isDucking,
  roarReady,
  currentBiome,
  mode,
  gameTime,
  lives,
  maxLives,
  dinoBattery,
  babyDinos,
  voiceEnabled,
  activePowerUps,
  onToggleMute,
  onToggleVoice,
  onPause,
  onHome,
  onTriggerRoar,
  onTriggerStomp,
}) => {
  if (gameState !== 'playing') return null;

  const speedMultiplier = (currentSpeed / 380).toFixed(1);
  const isKidFriendlyMode = mode === 'kid_adventure' || mode === 'family_coop';

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 sm:p-5 select-none">
      {/* Top Bar Perimeter Clusters */}
      <div className="flex items-start justify-between gap-3">
        {/* Left Status Cluster */}
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          {/* Hearts / Lives Bar */}
          {isKidFriendlyMode && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/85 backdrop-blur-md border border-rose-500/40 shadow-lg w-fit">
              <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wide mr-1">Hearts:</span>
              {Array.from({ length: maxLives }).map((_, i) => (
                <Heart
                  key={i}
                  className={`w-4 h-4 transition-all duration-300 ${
                    i < lives
                      ? 'text-rose-500 fill-rose-500 animate-pulse'
                      : 'text-slate-600 fill-slate-800'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Jump Count, Dino Battery & Mode Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 shadow-lg">
              <Flame className={`w-4 h-4 ${physicalJumps > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
              <span className="text-xs font-semibold text-slate-300">Jumps:</span>
              <span className="text-sm font-bold font-mono-num text-amber-300">
                {physicalJumps}
                {mode === 'sprint50' && <span className="text-slate-500 text-xs font-normal"> / 50</span>}
              </span>
            </div>

            {/* Dino Battery Bar */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 shadow-lg text-xs font-mono-num">
              <BatteryCharging className={`w-3.5 h-3.5 ${dinoBattery > 50 ? 'text-emerald-400 animate-bounce' : 'text-amber-400'}`} />
              <span className="text-[11px] text-slate-300 font-sans">Battery:</span>
              <span className={`font-bold ${dinoBattery > 50 ? 'text-emerald-400' : 'text-amber-300'}`}>
                {Math.round(dinoBattery)}%
              </span>
            </div>

            {/* Baby Dinos Squad */}
            {babyDinos.length > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold shadow-lg animate-pulse">
                <span>🐣 Squad:</span>
                <span className="font-mono-num">{babyDinos.length}</span>
              </div>
            )}
          </div>

          {/* Active Power-Ups Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {Array.from(activePowerUps.values()).map((p) => (
              <div
                key={p.type}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-950/80 border border-sky-400/60 text-sky-300 text-[11px] font-bold animate-pulse"
              >
                {p.type === 'shield' && <Shield className="w-3 h-3 text-sky-400" />}
                {p.type === 'wings' && <Wind className="w-3 h-3 text-amber-400" />}
                {p.type === 'magnet' && <Magnet className="w-3 h-3 text-rose-400" />}
                {p.type === 'multiplier' && <Zap className="w-3 h-3 text-yellow-400" />}
                <span className="capitalize">{p.type}</span>
                <span className="font-mono-num text-[10px] text-sky-200">
                  {Math.ceil(p.remainingTime)}s
                </span>
              </div>
            ))}
          </div>

          {/* Action Prompts (Roar & Stomp) */}
          <div className="flex items-center gap-2">
            {roarReady && (
              <button
                onClick={onTriggerRoar}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/60 text-rose-300 text-[11px] font-bold animate-bounce transition cursor-pointer"
                title="Raise arms overhead or Press R"
              >
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                ROAR (Raise Arms)
              </button>
            )}

            <button
              onClick={onTriggerStomp}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 text-[11px] font-medium transition cursor-pointer"
              title="Stomp feet or click to smash rocks"
            >
              🦶 Stomp Rocks
            </button>

            {isDucking && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-bold animate-pulse">
                <ShieldAlert className="w-3.5 h-3.5" />
                DUCKING
              </div>
            )}
          </div>
        </div>

        {/* Center: Distance & Eggs */}
        <div className="hidden md:flex items-center gap-3 px-3 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 shadow-lg pointer-events-auto">
          <div className="flex items-center gap-1 text-xs text-yellow-300">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span className="font-mono-num font-bold">{eggsCollected}</span>
            <span className="text-slate-400">Eggs</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1 text-xs text-slate-300 font-mono-num">
            <Footprints className="w-3.5 h-3.5 text-slate-400" />
            <span>{Math.floor(distanceMeters)}m</span>
          </div>
        </div>

        {/* Right Status Cluster: Score & Audio Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-xl">
            {highScore > 0 && (
              <div className="flex items-center gap-1 text-xs font-pixel text-slate-500">
                <span className="text-[10px]">HI</span>
                <span className="text-slate-400">{String(highScore).padStart(5, '0')}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-sm font-pixel font-bold text-emerald-400">
              {String(score).padStart(5, '0')}
            </div>
          </div>

          {/* Cheer Voice Toggle */}
          <button
            onClick={onToggleVoice}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/70 shadow-lg transition active:scale-95"
            title={voiceEnabled ? 'Cheer Voice: Enabled' : 'Cheer Voice: Muted'}
          >
            {voiceEnabled ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleMute}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/70 shadow-lg transition active:scale-95"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Pause */}
          <button
            onClick={onPause}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/70 shadow-lg transition active:scale-95"
            title="Pause Game (Esc)"
          >
            <Pause className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Home Button */}
          {onHome && (
            <button
              onClick={onHome}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-amber-500/40 shadow-lg transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
              title="Return to Main Screen (Home / H key)"
            >
              <Home className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider hidden sm:inline">Home</span>
            </button>
          )}
        </div>
      </div>

      {/* Center Jump Banner */}
      {jumpFlash && (
        <div className="self-center mb-16 animate-jump-pulse">
          <div className="px-5 py-2 rounded-2xl bg-emerald-500 text-slate-950 font-pixel font-bold text-lg sm:text-xl shadow-2xl shadow-emerald-400/50 flex items-center gap-2 border-2 border-white">
            <Flame className="w-6 h-6 text-slate-950 animate-bounce" />
            SUPER JUMP!
          </div>
        </div>
      )}

      {/* Bottom Hint */}
      <div className="self-center px-4 py-1 rounded-full bg-slate-950/70 backdrop-blur-sm border border-slate-800 text-[11px] text-slate-300 font-mono-num flex items-center gap-2">
        <span>Hop to leap</span>
        <span>·</span>
        <span>Stomp feet or press ↓ to smash</span>
        <span>·</span>
        <span>Raise arms to roar</span>
        <span>·</span>
        <span>Freeze when the sleeping dino appears!</span>
      </div>
    </div>
  );
};

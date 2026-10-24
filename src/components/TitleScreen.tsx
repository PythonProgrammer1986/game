import React from 'react';
import { AccessoryType, DinoSkin, DinoSkinConfig, GameMode, GameSpeed, SPEED_PRESETS } from '../game/types';
import { DINO_SKINS } from '../game/skins';
import { ACCESSORIES } from '../game/accessories';
import { Camera, Volume2, VolumeX, Sparkles, Play, Award, Zap, Flame, Timer, Heart, Users, Mic, MicOff, Gauge, Lock, Unlock, Smartphone } from 'lucide-react';

interface TitleScreenProps {
  onStart: () => void;
  onOpenWarmUp: () => void;
  selectedSkin: DinoSkin;
  onSelectSkin: (skin: DinoSkin) => void;
  selectedAccessory: AccessoryType;
  onSelectAccessory: (acc: AccessoryType) => void;
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  speedSetting: GameSpeed;
  onSetSpeed: (speed: GameSpeed) => void;
  lockSpeed: boolean;
  onToggleLockSpeed: () => void;
  sensitivity: 'low' | 'normal' | 'high' | 'extreme';
  onSetSensitivity: (s: 'low' | 'normal' | 'high' | 'extreme') => void;
  cameraActive: boolean;
  onStartCamera: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  highScore: number;
  totalEggs: number;
  cameraCalibrationSlot?: React.ReactNode;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  onOpenWarmUp,
  selectedSkin,
  onSelectSkin,
  selectedAccessory,
  onSelectAccessory,
  selectedMode,
  onSelectMode,
  speedSetting,
  onSetSpeed,
  lockSpeed,
  onToggleLockSpeed,
  sensitivity,
  onSetSensitivity,
  cameraActive,
  onStartCamera,
  isMuted,
  onToggleMute,
  voiceEnabled,
  onToggleVoice,
  highScore,
  totalEggs,
  cameraCalibrationSlot,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-3 sm:p-6 select-none overflow-y-auto bg-slate-950/85 backdrop-blur-sm">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-pixel bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-lg">
            KIDS & FAMILY
          </span>
          {highScore > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-0.5 sm:py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono-num text-amber-400">
              <Award className="w-3.5 h-3.5" />
              <span>{highScore}</span>
            </div>
          )}
          <div className="flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-xs font-mono-num text-yellow-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{totalEggs} Eggs</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onToggleVoice}
            className={`px-2.5 py-1 rounded-xl border text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition ${
              voiceEnabled
                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-sm'
                : 'bg-slate-900/80 border-slate-800 text-slate-400'
            }`}
            title="Toggle cheerleader voice"
          >
            {voiceEnabled ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-slate-500" />}
            <span className="hidden sm:inline">Voice: {voiceEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={onOpenWarmUp}
            className="px-2.5 py-1 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/80 text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition active:scale-95"
            title="Calibrate your jumps"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">10s</span> Warm-Up
          </button>

          <button
            onClick={onToggleMute}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition active:scale-95"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Hero Centerpiece: Title Lockup */}
      <div className="flex flex-col items-center justify-center my-auto text-center max-w-3xl mx-auto py-2">
        <div className="relative mb-1.5 group cursor-pointer" onClick={onStart}>
          <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-amber-500/20 rounded-full blur-2xl group-hover:scale-110 transition duration-500 opacity-70" />
          <svg
            className="w-16 h-16 sm:w-20 sm:h-20 text-emerald-400 drop-shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-transform duration-300 group-hover:scale-105"
            viewBox="0 0 72 72"
            fill="currentColor"
          >
            <path d="M28 8h24v16H64v12H52v4H32v12H20v12H12V52H4V36h8v-8h8V16h8V8z" fill="currentColor" />
            <rect x="36" y="12" width="6" height="6" fill="#0f172a" />
            <rect x="38" y="14" width="2" height="2" fill="#ffffff" />
            <rect x="48" y="28" width="8" height="4" fill="currentColor" opacity="0.8" />
            <rect x="52" y="32" width="4" height="6" fill="currentColor" opacity="0.8" />
            <rect x="24" y="52" width="6" height="12" fill="currentColor" />
            <rect x="24" y="64" width="10" height="4" fill="currentColor" />
            <rect x="36" y="52" width="6" height="8" fill="currentColor" />
            <rect x="32" y="60" width="8" height="4" fill="currentColor" />
          </svg>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-heading mb-0.5 text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
          DINO JUMP <span className="text-emerald-400">FAMILY & KIDS</span>
        </h1>
        <p className="text-[11px] sm:text-xs text-slate-300 max-w-lg mb-3 leading-relaxed">
          Hop in front of phone camera · Stomp feet to smash · Raise arms to roar · Freeze like a statue!
        </p>

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 mb-3 p-1 rounded-2xl bg-slate-900 border border-slate-800 flex-wrap justify-center">
          {[
            { id: 'kid_adventure', label: '⭐ Kids Adventure (3 Hearts)', icon: Heart },
            { id: 'family_coop', label: '🦖 Family Co-Op (Big & Little Dino)', icon: Users },
            { id: 'sprint50', label: '⚡ 50 Jump Race', icon: Flame },
            { id: 'endless', label: '🏃 Classic Endless', icon: Play },
          ].map((m) => {
            const isSel = selectedMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onSelectMode(m.id as GameMode)}
                className={`px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                  isSel
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* FRONT SCREEN CAMERA CALIBRATION CENTER */}
        {cameraCalibrationSlot}

        {/* SPEED CONTROLLER FOR PARENT & CHILD */}
        <div className="w-full max-w-lg mb-3 p-2.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-md">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-cyan-400" />
              Game Speed (Kid Pace):
            </span>
            <button
              onClick={onToggleLockSpeed}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
                lockSpeed
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title="When locked, the dino maintains a steady pace and never speeds up!"
            >
              {lockSpeed ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              <span>{lockSpeed ? 'Constant Pace (No Speed-Up)' : 'Gradual Acceleration'}</span>
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {(['gentle', 'normal', 'fast', 'turbo'] as GameSpeed[]).map((spd) => {
              const preset = SPEED_PRESETS[spd];
              const isSel = speedSetting === spd;
              return (
                <button
                  key={spd}
                  onClick={() => onSetSpeed(spd)}
                  className={`py-1.5 px-2 rounded-xl border text-center transition cursor-pointer ${
                    isSel
                      ? 'border-cyan-400 bg-cyan-950/60 shadow-md text-white font-bold'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="text-base">{preset.icon}</div>
                  <div className="text-[10px] font-semibold truncate">{preset.label}</div>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-cyan-300/80 mt-1.5 text-center">
            {SPEED_PRESETS[speedSetting]?.description}
          </p>
        </div>

        {/* Mobile Camera Help Tip */}
        <div className="w-full max-w-lg mb-3 flex items-center gap-2 p-2 px-3 rounded-xl bg-cyan-950/40 border border-cyan-800/50 text-cyan-200 text-left">
          <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-[11px] leading-tight">
            <strong>Playing on Mobile?</strong> Prop your phone upright on a table or sofa facing you so the front selfie camera sees your upper body!
          </span>
        </div>

        {/* Primary Start CTA */}
        <div className="flex items-center gap-4 mb-3">
          <button
            onClick={onStart}
            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-pixel text-xs sm:text-sm font-bold rounded-2xl shadow-xl shadow-emerald-500/30 flex items-center gap-2 transition transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            START PLAYING (SPACE / TAP)
          </button>
        </div>

        {/* Silly Costumes & Hats Closet */}
        <div className="w-full max-w-lg mb-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Pick A Silly Costume
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
            {Object.values(ACCESSORIES).map((acc) => {
              const isSel = selectedAccessory === acc.id;
              return (
                <button
                  key={acc.id}
                  onClick={() => onSelectAccessory(acc.id)}
                  className={`p-1 rounded-xl border text-center transition cursor-pointer ${
                    isSel
                      ? 'border-cyan-400 bg-cyan-950/40 shadow-sm'
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                  }`}
                >
                  <div className="text-base">{acc.icon}</div>
                  <div className="text-[9px] font-bold text-slate-200 truncate">{acc.name.split(' ')[0]}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dinosaur Skins */}
        <div className="w-full max-w-lg mb-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
            {(Object.values(DINO_SKINS) as DinoSkinConfig[]).map((skin) => {
              const isSelected = selectedSkin === skin.id;
              return (
                <button
                  key={skin.id}
                  onClick={() => onSelectSkin(skin.id)}
                  className={`p-1.5 rounded-xl border text-left transition cursor-pointer ${
                    isSelected
                      ? 'border-emerald-400 bg-emerald-950/40 shadow-sm'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white/20"
                      style={{ backgroundColor: skin.primaryColor }}
                    />
                    <span className="text-[11px] font-bold text-slate-200 truncate">{skin.name.split(' ')[0]}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Jump Sensitivity */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>Jump Sensitivity:</span>
          <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
            {(['low', 'normal', 'high', 'extreme'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => onSetSensitivity(lvl)}
                className={`px-2 py-0.5 text-[10px] font-medium rounded capitalize transition cursor-pointer ${
                  sensitivity === lvl
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Flat Control-Hint Line */}
      <div className="text-center pt-2 border-t border-slate-900 text-[11px] font-mono-num text-slate-400">
        Jump in front of phone · Stomp feet to smash · Raise arms to roar · Freeze like a statue
      </div>
    </div>
  );
};

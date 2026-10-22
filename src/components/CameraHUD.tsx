import React, { useState } from 'react';
import { Camera, RefreshCw, Zap, Sliders, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Flame, SwitchCamera, Smartphone } from 'lucide-react';

interface CameraHUDProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  hudCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  cameraActive: boolean;
  hasPermission: boolean | null;
  cameraError: string | null;
  facingMode?: 'user' | 'environment';
  onToggleFacingMode?: () => void;
  jumpFlash: boolean;
  roarFlash?: boolean;
  physicalJumpCount: number;
  sensitivity: 'low' | 'normal' | 'high' | 'extreme';
  motionIntensity: number;
  onSetSensitivity: (s: 'low' | 'normal' | 'high' | 'extreme') => void;
  onRecalibrate: () => void;
  onStartCamera: () => void;
  onTriggerTestJump: () => void;
  onTriggerTestRoar?: () => void;
  variant?: 'floating' | 'embedded';
}

export const CameraHUD: React.FC<CameraHUDProps> = ({
  videoRef,
  hudCanvasRef,
  cameraActive,
  hasPermission,
  cameraError,
  facingMode = 'user',
  onToggleFacingMode,
  jumpFlash,
  roarFlash = false,
  physicalJumpCount,
  sensitivity,
  motionIntensity,
  onSetSensitivity,
  onRecalibrate,
  onStartCamera,
  onTriggerTestJump,
  onTriggerTestRoar,
  variant = 'floating',
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  return (
    <div
      className={`transition-all duration-300 pointer-events-auto select-none ${
        variant === 'floating'
          ? 'fixed top-2 right-2 sm:top-3 sm:right-3 z-30'
          : 'w-full max-w-md mx-auto'
      }`}
    >
      <div
        className={`rounded-2xl border transition-all duration-300 shadow-2xl backdrop-blur-md ${
          jumpFlash
            ? 'border-emerald-400 bg-emerald-950/80 shadow-emerald-500/30'
            : roarFlash
            ? 'border-rose-400 bg-rose-950/80 shadow-rose-500/30'
            : 'border-slate-700/80 bg-slate-900/90 shadow-black/60'
        } ${isMinimized ? 'p-1.5' : 'p-2 sm:p-3'}`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-1.5 pb-1.5 mb-1.5 border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${
                cameraActive
                  ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400'
                  : hasPermission === false
                  ? 'bg-rose-500'
                  : 'bg-amber-400'
              }`}
            />
            <span className="text-[11px] sm:text-xs font-semibold tracking-wide text-slate-200 uppercase font-heading flex items-center gap-1">
              <Camera className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">Body Jump</span> Tracker
            </span>
          </div>

          <div className="flex items-center gap-1">
            {jumpFlash && (
              <span className="px-1.5 py-0.5 text-[9px] font-pixel bg-emerald-500 text-slate-950 font-bold rounded animate-jump-pulse">
                JUMP!
              </span>
            )}

            {/* Flip camera on mobile */}
            {onToggleFacingMode && cameraActive && (
              <button
                onClick={onToggleFacingMode}
                className="p-1 text-slate-400 hover:text-cyan-300 transition-colors rounded hover:bg-slate-800"
                title={`Switch camera (current: ${facingMode === 'user' ? 'Front' : 'Back'})`}
                aria-label="Switch camera"
              >
                <SwitchCamera className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1 text-slate-400 hover:text-slate-200 transition-colors rounded hover:bg-slate-800"
              title="Tracking sensitivity"
              aria-label="Tracking sensitivity"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>

            {variant === 'floating' && (
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 text-slate-400 hover:text-slate-200 transition-colors rounded hover:bg-slate-800"
                title={isMinimized ? 'Expand Camera View' : 'Minimize View'}
                aria-label="Toggle camera minimize"
              >
                {isMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Video / Canvas Viewport */}
        {!isMinimized && (
          <div className="relative w-36 sm:w-52 aspect-[4/3] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner group">
            <video
              ref={videoRef}
              playsInline
              webkit-playsinline="true"
              muted
              autoPlay
              className={`absolute inset-0 w-full h-full object-cover opacity-90 ${
                facingMode === 'user' ? '-scale-x-100' : ''
              }`}
            />

            <canvas
              ref={hudCanvasRef}
              width={200}
              height={150}
              className={`absolute inset-0 w-full h-full pointer-events-none ${
                facingMode === 'user' ? '-scale-x-100' : ''
              }`}
            />

            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center bg-slate-950/95 backdrop-blur-sm">
                {cameraError ? (
                  <>
                    <AlertCircle className="w-5 h-5 text-rose-400 mb-1" />
                    <p className="text-[10px] text-rose-300 font-medium leading-tight mb-1.5 px-1">
                      {cameraError}
                    </p>
                    <button
                      onClick={onStartCamera}
                      className="px-2 py-1 text-[10px] bg-rose-600 hover:bg-rose-500 text-white rounded font-medium transition cursor-pointer"
                    >
                      Retry Camera
                    </button>
                  </>
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-cyan-400 mb-1 animate-bounce" />
                    <p className="text-[11px] text-slate-300 font-medium mb-1.5">
                      Enable camera to jump physically!
                    </p>
                    <button
                      onClick={onStartCamera}
                      className="px-2.5 py-1 text-[11px] bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-semibold rounded-lg shadow-md transition cursor-pointer"
                    >
                      Start Camera
                    </button>
                  </>
                )}
              </div>
            )}

            {jumpFlash && (
              <div className="absolute inset-0 border-4 border-emerald-400 pointer-events-none rounded-xl animate-pulse bg-emerald-500/10" />
            )}
            {roarFlash && (
              <div className="absolute inset-0 border-4 border-rose-500 pointer-events-none rounded-xl animate-pulse bg-rose-500/20" />
            )}

            {cameraActive && (
              <div className="absolute top-1 left-1 right-1 flex justify-between items-center px-1 py-0.5 rounded bg-slate-950/70 text-[9px] font-mono-num text-slate-300">
                <span className="flex items-center gap-0.5 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Ready
                </span>
                <span>Jumps: {physicalJumpCount}</span>
              </div>
            )}

            {cameraActive && (
              <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={onRecalibrate}
                  className="px-1.5 py-0.5 text-[9px] font-medium bg-slate-900/90 hover:bg-cyan-900/80 text-cyan-300 rounded border border-cyan-800/60 flex items-center gap-1 transition"
                  title="Calibrate baseline height"
                >
                  <RefreshCw className="w-2 h-2" />
                  Calibrate
                </button>

                <div className="flex items-center gap-0.5">
                  {onTriggerTestRoar && (
                    <button
                      onClick={onTriggerTestRoar}
                      className="px-1.5 py-0.5 text-[9px] font-medium bg-slate-900/90 hover:bg-rose-900/80 text-rose-300 rounded border border-rose-800/60 flex items-center gap-0.5 transition"
                      title="Test Roar"
                    >
                      <Flame className="w-2 h-2 text-rose-400" />
                      Roar
                    </button>
                  )}
                  <button
                    onClick={onTriggerTestJump}
                    className="px-1.5 py-0.5 text-[9px] font-medium bg-slate-900/90 hover:bg-emerald-900/80 text-emerald-300 rounded border border-emerald-800/60 flex items-center gap-0.5 transition"
                    title="Simulate jump test"
                  >
                    <Zap className="w-2 h-2 text-emerald-400" />
                    Jump
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mobile Positioning Hint & Settings Panel */}
        {showSettings && (
          <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-1 text-[10px] text-cyan-300 mb-2 p-1.5 rounded-lg bg-cyan-950/40 border border-cyan-800/50">
              <Smartphone className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
              <span>Prop your phone upright on a desk or table so the front camera sees you!</span>
            </div>

            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-400 font-medium text-[11px]">Jump Sensitivity:</span>
              <span className="text-cyan-400 font-mono capitalize text-[11px]">{sensitivity}</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {(['low', 'normal', 'high', 'extreme'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => onSetSensitivity(lvl)}
                  className={`py-0.5 text-[10px] font-semibold rounded capitalize transition ${
                    sensitivity === lvl
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Motion Activity Bar */}
        {cameraActive && !isMinimized && (
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-[9px] text-slate-400 font-mono-num uppercase">Motion:</span>
            <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-75 ${
                  motionIntensity > 0.4 ? 'bg-emerald-400' : 'bg-cyan-500'
                }`}
                style={{ width: `${Math.round(motionIntensity * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

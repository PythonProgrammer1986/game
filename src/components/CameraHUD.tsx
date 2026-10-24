import React, { useState } from 'react';
import {
  Camera,
  RefreshCw,
  Zap,
  Sliders,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Flame,
  SwitchCamera,
  Smartphone,
  Target,
  Sparkles,
} from 'lucide-react';

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
  onCalibrateCurrentPose?: () => void;
  isCalibrated?: boolean;
  jumpProgress?: number;
  onStartCamera: () => void;
  onTriggerTestJump: () => void;
  onTriggerTestRoar?: () => void;
  variant?: 'floating' | 'embedded' | 'front_screen';
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
  onCalibrateCurrentPose,
  isCalibrated = false,
  jumpProgress = 0,
  onStartCamera,
  onTriggerTestJump,
  onTriggerTestRoar,
  variant = 'floating',
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [calibratingCountdown, setCalibratingCountdown] = useState<number | null>(null);
  const [justCalibratedToast, setJustCalibratedToast] = useState<boolean>(false);

  // Handle guided calibration with countdown
  const handleStartCalibration = () => {
    if (calibratingCountdown !== null) return;
    setCalibratingCountdown(3);

    const timer1 = setTimeout(() => setCalibratingCountdown(2), 700);
    const timer2 = setTimeout(() => setCalibratingCountdown(1), 1400);
    const timer3 = setTimeout(() => {
      setCalibratingCountdown(null);
      if (onCalibrateCurrentPose) {
        onCalibrateCurrentPose();
      } else {
        onRecalibrate();
      }
      setJustCalibratedToast(true);
      setTimeout(() => setJustCalibratedToast(false), 2400);
    }, 2100);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  };

  // ==========================================
  // FRONT SCREEN CALIBRATION DASHBOARD VARIANT
  // ==========================================
  if (variant === 'front_screen') {
    return (
      <div className="w-full max-w-xl mx-auto mb-3 p-3 sm:p-4 rounded-3xl bg-slate-900/95 border-2 border-cyan-500/40 shadow-2xl backdrop-blur-md text-left transition-all">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold font-heading text-white tracking-wide flex items-center gap-2">
                CAMERA JUMP CALIBRATION
                {isCalibrated ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> CALIBRATED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                    ● STAND & CALIBRATE
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-slate-400">
                Upper-body half skeleton tracker · Only real jumps leap over obstacles!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onToggleFacingMode && cameraActive && (
              <button
                onClick={onToggleFacingMode}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                title="Switch front/back camera"
              >
                <SwitchCamera className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">{facingMode === 'user' ? 'Front' : 'Rear'} Cam</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Camera Viewport + Half Skeleton Canvas */}
        <div className="relative w-full aspect-[4/3] max-h-56 sm:max-h-64 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner mb-3">
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

          {/* Dotted Standing Silhouette Guide */}
          {cameraActive && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-30">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-cyan-400 mb-1" />
              <div className="w-40 h-28 rounded-t-3xl border-2 border-dashed border-cyan-400" />
            </div>
          )}

          {/* Camera Disabled State */}
          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-950/90 backdrop-blur-sm z-20">
              {cameraError ? (
                <>
                  <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
                  <p className="text-xs text-rose-300 font-medium max-w-sm mb-3">{cameraError}</p>
                  <button
                    onClick={onStartCamera}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-lg cursor-pointer"
                  >
                    Retry Camera
                  </button>
                </>
              ) : (
                <>
                  <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-2 animate-bounce">
                    <Camera className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Camera Required For Physical Jumping</h4>
                  <p className="text-xs text-slate-400 max-w-md mb-3 leading-relaxed">
                    Hop in real life to make the dino jump! We track your upper body skeleton safely inside your browser.
                  </p>
                  <button
                    onClick={onStartCamera}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 active:scale-95 text-slate-950 text-xs sm:text-sm font-pixel font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                  >
                    TURN ON CAMERA TO CALIBRATE
                  </button>
                </>
              )}
            </div>
          )}

          {/* Jump Visual Flash */}
          {jumpFlash && (
            <div className="absolute inset-0 border-4 border-emerald-400 pointer-events-none rounded-2xl animate-pulse bg-emerald-500/20 flex items-center justify-center z-10">
              <div className="px-4 py-2 bg-emerald-500 text-slate-950 font-pixel font-bold text-sm sm:text-base rounded-xl shadow-2xl flex items-center gap-2 border-2 border-white">
                <Flame className="w-5 h-5" />
                JUMP DETECTED!
              </div>
            </div>
          )}

          {/* Countdown Overlay */}
          {calibratingCountdown !== null && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-30 animate-in fade-in">
              <span className="text-slate-300 text-xs font-semibold mb-1">Stand still in your normal position...</span>
              <div className="text-5xl font-extrabold text-cyan-400 font-pixel animate-ping">
                {calibratingCountdown}
              </div>
            </div>
          )}

          {/* Just Calibrated Toast */}
          {justCalibratedToast && (
            <div className="absolute bottom-3 left-3 right-3 py-2 px-3 rounded-xl bg-emerald-500/90 text-slate-950 font-bold text-xs text-center flex items-center justify-center gap-1.5 shadow-xl animate-in zoom-in-95 z-30">
              <Sparkles className="w-4 h-4" />
              <span>Calibrated! Your standing baseline is locked in!</span>
            </div>
          )}
        </div>

        {/* Calibration Action & Test Radar */}
        <div className="space-y-2.5">
          {/* Main Calibration Button */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <button
              onClick={handleStartCalibration}
              disabled={!cameraActive}
              className={`w-full sm:flex-1 py-2.5 px-4 rounded-xl font-pixel text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-lg ${
                cameraActive
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Target className="w-4 h-4 fill-slate-950" />
              🎯 CALIBRATE MY HEIGHT (STAND HERE)
            </button>

            <button
              onClick={onTriggerTestJump}
              disabled={!cameraActive}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simulate Jump</span>
            </button>
          </div>

          {/* Real-time Jump Power Meter / Radar */}
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] mb-1 font-mono-num">
              <span className="text-slate-300 font-sans font-semibold flex items-center gap-1">
                <span>Jump Power Radar:</span>
                {jumpProgress >= 1.0 ? (
                  <span className="text-emerald-400 font-bold">JUMP THRESHOLD REACHED! 🎉</span>
                ) : (
                  <span className="text-slate-400">Hop to test ({Math.round(jumpProgress * 100)}%)</span>
                )}
              </span>
              <span className="text-cyan-400 font-bold">Test Jumps: {physicalJumpCount}</span>
            </div>

            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  jumpProgress >= 1.0
                    ? 'bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse'
                    : jumpProgress > 0.5
                    ? 'bg-amber-400'
                    : 'bg-cyan-500'
                }`}
                style={{ width: `${Math.min(100, Math.round(jumpProgress * 100))}%` }}
              />
            </div>
          </div>

          {/* Jump Sensitivity Controller with Kid/Parent Advice */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 pt-1 text-xs">
            <div className="text-slate-300">
              <span className="font-semibold text-white">Sensitivity: </span>
              <span className="text-slate-400 text-[11px]">(Set to Low/Normal if small twitches trigger jumps)</span>
            </div>

            <div className="grid grid-cols-4 gap-1 w-full sm:w-auto">
              {(['low', 'normal', 'high', 'extreme'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => onSetSensitivity(lvl)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg capitalize transition cursor-pointer ${
                    sensitivity === lvl
                      ? 'bg-cyan-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
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
  }

  // ==========================================
  // IN-GAME FLOATING HUD VARIANT
  // ==========================================
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
        } ${isMinimized ? 'p-1.5' : 'p-2 sm:p-2.5'}`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-1.5 pb-1 mb-1 border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${
                cameraActive
                  ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400'
                  : hasPermission === false
                  ? 'bg-rose-500'
                  : 'bg-amber-400'
              }`}
            />
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-wide text-slate-200 uppercase font-heading flex items-center gap-1">
              <Camera className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">Skeleton</span> Tracker
            </span>
          </div>

          <div className="flex items-center gap-1">
            {jumpFlash && (
              <span className="px-1.5 py-0.2 text-[8px] font-pixel bg-emerald-500 text-slate-950 font-bold rounded animate-jump-pulse">
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
          <div className="relative w-36 sm:w-48 aspect-[4/3] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner group">
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
                  <CheckCircle2 className="w-2.5 h-2.5" /> Tracked
                </span>
                <span>Jumps: {physicalJumpCount}</span>
              </div>
            )}

            {cameraActive && (
              <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={onCalibrateCurrentPose || onRecalibrate}
                  className="px-1.5 py-0.5 text-[9px] font-medium bg-slate-900/90 hover:bg-cyan-900/80 text-cyan-300 rounded border border-cyan-800/60 flex items-center gap-1 transition cursor-pointer"
                  title="Calibrate standing height"
                >
                  <RefreshCw className="w-2 h-2" />
                  Calibrate
                </button>

                <div className="flex items-center gap-0.5">
                  {onTriggerTestRoar && (
                    <button
                      onClick={onTriggerTestRoar}
                      className="px-1.5 py-0.5 text-[9px] font-medium bg-slate-900/90 hover:bg-rose-900/80 text-rose-300 rounded border border-rose-800/60 flex items-center gap-0.5 transition cursor-pointer"
                      title="Test Roar"
                    >
                      <Flame className="w-2 h-2 text-rose-400" />
                      Roar
                    </button>
                  )}
                  <button
                    onClick={onTriggerTestJump}
                    className="px-1.5 py-0.5 text-[9px] font-medium bg-slate-900/90 hover:bg-emerald-900/80 text-emerald-300 rounded border border-emerald-800/60 flex items-center gap-0.5 transition cursor-pointer"
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

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-1 text-[10px] text-cyan-300 mb-1.5 p-1 rounded-lg bg-cyan-950/40 border border-cyan-800/50">
              <Smartphone className="w-3 h-3 shrink-0 text-cyan-400" />
              <span>Prop phone upright facing your upper body!</span>
            </div>

            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-400 font-medium text-[10px]">Jump Sensitivity:</span>
              <span className="text-cyan-400 font-mono capitalize text-[10px]">{sensitivity}</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {(['low', 'normal', 'high', 'extreme'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => onSetSensitivity(lvl)}
                  className={`py-0.5 text-[9px] font-semibold rounded capitalize transition ${
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
      </div>
    </div>
  );
};

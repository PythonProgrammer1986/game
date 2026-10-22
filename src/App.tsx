import { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, DinoSkin, AccessoryType, GameMode, WorkoutReport, ActivePowerUp, PowerUpType, BiomeType, BabyDino } from './game/types';
import { DINO_SKINS } from './game/skins';
import { DinoEngine } from './game/dinoEngine';
import { GameCanvas } from './game/GameCanvas';
import { CameraHUD } from './components/CameraHUD';
import { GameHUD } from './components/GameHUD';
import { TitleScreen } from './components/TitleScreen';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { WarmUpModal } from './components/WarmUpModal';
import { useCameraMotion } from './hooks/useCameraMotion';
import { sound } from './utils/audio';
import { cheerVoice } from './utils/speech';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('title');
  const [selectedSkin, setSelectedSkin] = useState<DinoSkin>(() => {
    return (localStorage.getItem('dino_jump_skin') as DinoSkin) || 'classic';
  });

  const [selectedAccessory, setSelectedAccessory] = useState<AccessoryType>(() => {
    return (localStorage.getItem('dino_jump_accessory') as AccessoryType) || 'propeller_hat';
  });

  const [selectedMode, setSelectedMode] = useState<GameMode>(() => {
    return (localStorage.getItem('dino_jump_mode') as GameMode) || 'kid_adventure';
  });

  const [totalEggs, setTotalEggs] = useState<number>(() => {
    const saved = localStorage.getItem('dino_jump_total_eggs');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('dino_jump_high_score');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => cheerVoice.isEnabled());
  const [workoutReport, setWorkoutReport] = useState<WorkoutReport | null>(null);
  const [isWarmUpOpen, setIsWarmUpOpen] = useState<boolean>(false);

  // HUD sync states
  const [hudStats, setHudStats] = useState({
    score: 0,
    distanceMeters: 0,
    physicalJumps: 0,
    caloriesBurned: 0,
    eggsCollected: 0,
    currentSpeed: 380,
    isDucking: false,
    roarReady: true,
    currentBiome: 'desert' as BiomeType,
    gameTime: 0,
    lives: 3,
    maxLives: 3,
    dinoBattery: 90,
    babyDinos: [] as BabyDino[],
    activePowerUps: new Map<PowerUpType, ActivePowerUp>(),
  });

  const engineRef = useRef<DinoEngine | null>(null);

  // Handle Game Over
  const handleGameOver = useCallback((report: WorkoutReport) => {
    setWorkoutReport(report);
    setGameState('gameover');
    setHighScore((prevHigh) => {
      if (report.score > prevHigh) {
        localStorage.setItem('dino_jump_high_score', String(report.score));
        setIsNewHighScore(true);
        return report.score;
      }
      setIsNewHighScore(false);
      return prevHigh;
    });

    setTotalEggs((prev) => {
      const next = prev + (report.score > 0 ? Math.floor(report.score / 120) : 0);
      localStorage.setItem('dino_jump_total_eggs', String(next));
      return next;
    });
  }, []);

  // Handle Start / Restart
  const handleStartGame = useCallback(() => {
    sound.playClick();
    if (engineRef.current) {
      engineRef.current.reset();
    }
    setGameState('playing');
    setIsWarmUpOpen(false);
    cheerVoice.cheer('Ready, set, go! Hop like a dino!');
  }, []);

  // Handle camera physical jump
  const handleCameraJump = useCallback(
    (intensity: number) => {
      if (gameState === 'title' || gameState === 'gameover') {
        if (!isWarmUpOpen) {
          handleStartGame();
        }
      } else if (gameState === 'playing' && engineRef.current) {
        engineRef.current.triggerJump(true, intensity);
      }
    },
    [gameState, isWarmUpOpen, handleStartGame]
  );

  // Handle camera ducking
  const handleCameraDuck = useCallback(
    (isDucking: boolean) => {
      if (gameState === 'playing' && engineRef.current) {
        engineRef.current.setDucking(isDucking);
      }
    },
    [gameState]
  );

  // Handle camera roar gesture
  const handleRoarGesture = useCallback(() => {
    if (gameState === 'playing' && engineRef.current) {
      engineRef.current.triggerRoar();
    }
  }, [gameState]);

  // Handle camera stomp gesture
  const handleStompGesture = useCallback(() => {
    if (gameState === 'playing' && engineRef.current) {
      engineRef.current.triggerStomp();
    }
  }, [gameState]);

  // Camera motion hook
  const {
    cameraActive,
    hasPermission,
    cameraError,
    videoRef,
    hudCanvasRef,
    stats,
    motionIntensity,
    isFrozenStill,
    jumpFlash,
    roarFlash,
    physicalJumpCount,
    sensitivity,
    setSensitivity,
    recalibrate,
    startCamera,
    triggerManualJump,
    triggerManualRoar,
    triggerManualStomp,
  } = useCameraMotion({
    sensitivity: (localStorage.getItem('dino_jump_sensitivity') as 'low' | 'normal' | 'high' | 'extreme') || 'normal',
    onJump: handleCameraJump,
    onDuckChange: handleCameraDuck,
    onRoarGesture: handleRoarGesture,
    onStompGesture: handleStompGesture,
  });

  // Sync camera stillness to engine for Red Light / Green Light Dino Freeze
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.isCameraFrozenStill = isFrozenStill;
    }
  }, [isFrozenStill]);

  const handleSetSensitivity = useCallback(
    (lvl: 'low' | 'normal' | 'high' | 'extreme') => {
      setSensitivity(lvl);
      localStorage.setItem('dino_jump_sensitivity', lvl);
    },
    [setSensitivity]
  );

  const handleSelectSkin = useCallback((skin: DinoSkin) => {
    sound.playClick();
    setSelectedSkin(skin);
    localStorage.setItem('dino_jump_skin', skin);
  }, []);

  const handleSelectAccessory = useCallback((acc: AccessoryType) => {
    sound.playClick();
    setSelectedAccessory(acc);
    localStorage.setItem('dino_jump_accessory', acc);
  }, []);

  const handleSelectMode = useCallback((mode: GameMode) => {
    sound.playClick();
    setSelectedMode(mode);
    localStorage.setItem('dino_jump_mode', mode);
    if (engineRef.current) {
      engineRef.current.setMode(mode);
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleToggleVoice = useCallback(() => {
    const enabled = cheerVoice.toggleVoice();
    setVoiceEnabled(enabled);
  }, []);

  const handleTogglePause = useCallback(() => {
    if (gameState === 'playing') {
      sound.playClick();
      setGameState('paused');
      if (engineRef.current) {
        engineRef.current.state = 'paused';
      }
    } else if (gameState === 'paused') {
      sound.playClick();
      setGameState('playing');
      if (engineRef.current) {
        engineRef.current.state = 'playing';
      }
    }
  }, [gameState]);

  // Periodic HUD state sync from engine
  useEffect(() => {
    const timer = setInterval(() => {
      if (engineRef.current) {
        const eng = engineRef.current;
        setHudStats({
          score: eng.score,
          distanceMeters: eng.distanceMeters,
          physicalJumps: eng.physicalJumps,
          caloriesBurned: eng.caloriesBurned,
          eggsCollected: eng.eggsCollected,
          currentSpeed: eng.currentSpeed,
          isDucking: eng.dino.isDucking,
          roarReady: eng.roarReady,
          currentBiome: eng.currentBiome,
          gameTime: eng.gameTime,
          lives: eng.lives,
          maxLives: eng.maxLives,
          dinoBattery: eng.dinoBattery,
          babyDinos: [...eng.babyDinos],
          activePowerUps: new Map(eng.activePowerUps),
        });
      }
    }, 75);

    return () => clearInterval(timer);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        if (gameState === 'title' || gameState === 'gameover') {
          if (!isWarmUpOpen) handleStartGame();
        } else if (gameState === 'playing' && engineRef.current) {
          engineRef.current.triggerJump(false, 1.0);
        }
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        if (gameState === 'playing' && engineRef.current) {
          engineRef.current.setDucking(true);
        }
      } else if (e.code === 'KeyR' || e.code === 'KeyE') {
        e.preventDefault();
        if (gameState === 'playing' && engineRef.current) {
          engineRef.current.triggerRoar();
        }
      } else if (e.code === 'KeyF' || e.code === 'KeyX') {
        e.preventDefault();
        if (gameState === 'playing' && engineRef.current) {
          engineRef.current.triggerStomp();
        }
      } else if (e.code === 'Escape') {
        e.preventDefault();
        handleTogglePause();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        if (gameState === 'playing' && engineRef.current) {
          engineRef.current.setDucking(false);
        }
      }
    };

    const handleBlur = () => {
      if (engineRef.current) {
        engineRef.current.setDucking(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameState, isWarmUpOpen, handleStartGame, handleTogglePause]);

  // Touch controls
  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState === 'title' || gameState === 'gameover') {
      if (!isWarmUpOpen) handleStartGame();
      return;
    }

    if (gameState === 'playing' && engineRef.current) {
      const touchY = e.touches[0].clientY;
      const screenH = window.innerHeight;
      if (touchY > screenH * 0.72) {
        engineRef.current.setDucking(true);
      } else {
        engineRef.current.triggerJump(false, 1.0);
      }
    }
  };

  const handleTouchEnd = () => {
    if (gameState === 'playing' && engineRef.current) {
      engineRef.current.setDucking(false);
    }
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Isolated Canvas Viewport */}
      <GameCanvas
        engineRef={engineRef}
        skin={DINO_SKINS[selectedSkin]}
        accessory={selectedAccessory}
        mode={selectedMode}
        gameState={gameState}
        onGameOver={handleGameOver}
      />

      {/* Retro scanlines */}
      <div className="absolute inset-0 scanlines pointer-events-none z-10 opacity-30" />

      {/* In-Game HUD */}
      <GameHUD
        score={hudStats.score}
        highScore={highScore}
        distanceMeters={hudStats.distanceMeters}
        physicalJumps={hudStats.physicalJumps}
        caloriesBurned={hudStats.caloriesBurned}
        eggsCollected={hudStats.eggsCollected}
        currentSpeed={hudStats.currentSpeed}
        isMuted={isMuted}
        gameState={gameState}
        jumpFlash={jumpFlash}
        isDucking={hudStats.isDucking}
        roarReady={hudStats.roarReady}
        currentBiome={hudStats.currentBiome}
        mode={selectedMode}
        gameTime={hudStats.gameTime}
        lives={hudStats.lives}
        maxLives={hudStats.maxLives}
        dinoBattery={hudStats.dinoBattery}
        babyDinos={hudStats.babyDinos}
        voiceEnabled={voiceEnabled}
        activePowerUps={hudStats.activePowerUps}
        onToggleMute={handleToggleMute}
        onToggleVoice={handleToggleVoice}
        onPause={handleTogglePause}
        onTriggerRoar={() => engineRef.current?.triggerRoar()}
        onTriggerStomp={() => engineRef.current?.triggerStomp()}
      />

      {/* Camera HUD */}
      <CameraHUD
        videoRef={videoRef}
        hudCanvasRef={hudCanvasRef}
        cameraActive={cameraActive}
        hasPermission={hasPermission}
        cameraError={cameraError}
        jumpFlash={jumpFlash}
        roarFlash={roarFlash}
        physicalJumpCount={physicalJumpCount}
        sensitivity={sensitivity}
        motionIntensity={motionIntensity}
        onSetSensitivity={handleSetSensitivity}
        onRecalibrate={recalibrate}
        onStartCamera={startCamera}
        onTriggerTestJump={triggerManualJump}
        onTriggerTestRoar={triggerManualRoar}
        variant="floating"
      />

      {/* Title Screen */}
      {gameState === 'title' && (
        <TitleScreen
          onStart={handleStartGame}
          onOpenWarmUp={() => setIsWarmUpOpen(true)}
          selectedSkin={selectedSkin}
          onSelectSkin={handleSelectSkin}
          selectedAccessory={selectedAccessory}
          onSelectAccessory={handleSelectAccessory}
          selectedMode={selectedMode}
          onSelectMode={handleSelectMode}
          sensitivity={sensitivity}
          onSetSensitivity={handleSetSensitivity}
          cameraActive={cameraActive}
          onStartCamera={startCamera}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          voiceEnabled={voiceEnabled}
          onToggleVoice={handleToggleVoice}
          highScore={highScore}
          totalEggs={totalEggs}
        />
      )}

      {/* Warm-Up Test Modal */}
      {isWarmUpOpen && (
        <WarmUpModal
          onComplete={handleStartGame}
          onClose={() => setIsWarmUpOpen(false)}
          jumpCount={physicalJumpCount}
          lastJumpIntensity={stats.jumpIntensity}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={handleTogglePause}
          onRestart={handleStartGame}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          sensitivity={sensitivity}
          onSetSensitivity={handleSetSensitivity}
        />
      )}

      {/* Game Over / Award Certificate Modal */}
      {gameState === 'gameover' && (
        <GameOverModal
          report={workoutReport}
          highScore={highScore}
          isNewHighScore={isNewHighScore}
          onRestart={handleStartGame}
        />
      )}
    </div>
  );
}

import React, { useEffect, useRef } from 'react';
import { DinoEngine } from './dinoEngine';
import { GameRenderer } from './renderer';
import { AccessoryType, DinoSkinConfig, GameMode, GameSpeed, GameState, WorkoutReport } from './types';

interface GameCanvasProps {
  engineRef: React.MutableRefObject<DinoEngine | null>;
  skin: DinoSkinConfig;
  accessory: AccessoryType;
  mode: GameMode;
  speedSetting: GameSpeed;
  lockSpeed: boolean;
  gameState: GameState;
  onGameOver: (report: WorkoutReport) => void;
  onEggCollected?: () => void;
  onScoreMilestone?: (milestone: number) => void;
  onPowerUpCollected?: (type: string) => void;
  onBossEncounter?: (name: string) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  engineRef,
  skin,
  accessory,
  mode,
  speedSetting,
  lockSpeed,
  gameState,
  onGameOver,
  onEggCollected,
  onScoreMilestone,
  onPowerUpCollected,
  onBossEncounter,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const renderer = new GameRenderer(ctx);
    rendererRef.current = renderer;

    const w = canvas.width || 900;
    const h = canvas.height || 400;

    const engine = new DinoEngine({
      width: w,
      height: h,
      skin,
      accessory,
      mode,
      speedSetting,
      lockSpeed,
      onGameOver,
      onEggCollected,
      onScoreMilestone,
      onPowerUpCollected,
      onBossEncounter,
    });
    engineRef.current = engine;

    const container = containerRef.current;
    if (!container) return;

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);

      if (width === 0 || height === 0) return;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.resetTransform();
      ctx.scale(dpr, dpr);

      engine.setDimensions(width, height);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    handleResize();

    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const rawDt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      engine.update(rawDt);

      renderer.render({
        width: engine.width,
        height: engine.height,
        groundY: engine.groundY,
        gameTime: engine.gameTime,
        biome: engine.currentBiome,
        nightTransition: engine.nightTransition,
        mode: engine.mode,
        lives: engine.lives,
        maxLives: engine.maxLives,
        invincibleTimer: engine.invincibleTimer,
        dinoBattery: engine.dinoBattery,
        babyDinos: engine.babyDinos,
        freezeChallenge: engine.freezeChallenge,
        littleDino: engine.littleDino,
        dino: {
          x: engine.dino.x,
          y: engine.dino.y,
          width: engine.dino.width,
          height: engine.dino.height,
          isJumping: engine.dino.isJumping,
          isDucking: engine.dino.isDucking,
          isGliding: engine.dino.isGliding,
          runFrame: engine.dino.runFrame,
          squashX: engine.dino.squashX,
          squashY: engine.dino.squashY,
          isDead: engine.dino.isDead,
          skin: engine.dino.skin,
          accessory: engine.dino.accessory,
        },
        activePowerUps: engine.activePowerUps,
        boss: engine.boss,
        obstacles: engine.obstacles,
        particles: engine.particles,
        weatherParticles: engine.weatherParticles,
        shockwaves: engine.shockwaves,
        clouds: engine.clouds,
        stars: engine.stars,
        groundOffset: engine.groundOffset,
        screenShake: engine.screenShake,
        hitFlash: engine.hitFlash,
        lightningFlash: engine.lightningFlash,
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setSkin(skin);
    }
  }, [skin]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setAccessory(accessory);
    }
  }, [accessory]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setMode(mode);
    }
  }, [mode]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setSpeedSetting(speedSetting, lockSpeed);
    }
  }, [speedSetting, lockSpeed]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-950"
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full object-cover select-none cursor-pointer"
      />
    </div>
  );
};

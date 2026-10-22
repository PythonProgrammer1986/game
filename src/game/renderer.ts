import {
  AccessoryType,
  ActivePowerUp,
  BabyDino,
  BiomeType,
  Boss,
  Cloud,
  DinoSkinConfig,
  FreezeChallenge,
  Obstacle,
  ObstacleType,
  Particle,
  PowerUpType,
  Shockwave,
  Star,
  WeatherParticle,
} from './types';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public render(params: {
    width: number;
    height: number;
    groundY: number;
    gameTime: number;
    biome: BiomeType;
    nightTransition: number;
    mode: string;
    lives: number;
    maxLives: number;
    invincibleTimer: number;
    dinoBattery: number;
    babyDinos: BabyDino[];
    freezeChallenge: FreezeChallenge | null;
    dino: {
      x: number;
      y: number;
      width: number;
      height: number;
      isJumping: boolean;
      isDucking: boolean;
      isGliding: boolean;
      runFrame: number;
      squashX: number;
      squashY: number;
      isDead: boolean;
      skin: DinoSkinConfig;
      accessory: AccessoryType;
    };
    littleDino?: {
      x: number;
      y: number;
      width: number;
      height: number;
      isJumping: boolean;
    };
    activePowerUps: Map<PowerUpType, ActivePowerUp>;
    boss: Boss | null;
    obstacles: Obstacle[];
    particles: Particle[];
    weatherParticles: WeatherParticle[];
    shockwaves: Shockwave[];
    clouds: Cloud[];
    stars: Star[];
    groundOffset: number;
    screenShake: { x: number; y: number };
    hitFlash: number;
    lightningFlash: number;
  }) {
    const {
      width,
      height,
      groundY,
      gameTime,
      biome,
      nightTransition,
      mode,
      lives,
      maxLives,
      invincibleTimer,
      dinoBattery,
      babyDinos,
      freezeChallenge,
      dino,
      littleDino,
      activePowerUps,
      boss,
      obstacles,
      particles,
      weatherParticles,
      shockwaves,
      clouds,
      stars,
      groundOffset,
      screenShake,
      hitFlash,
      lightningFlash,
    } = params;

    const ctx = this.ctx;
    ctx.save();

    if (screenShake.x !== 0 || screenShake.y !== 0) {
      ctx.translate(screenShake.x, screenShake.y);
    }

    // 1. Sky & Biome
    this.renderSky(width, height, groundY, biome, nightTransition, stars, clouds);

    // 2. Parallax Mountains
    this.renderParallaxMountains(width, groundY, groundOffset, biome, nightTransition);

    // 3. Ground
    this.renderGround(width, groundY, groundOffset, biome, nightTransition);

    // 4. Obstacles, Eggs & Hearts
    for (const obs of obstacles) {
      this.renderObstacle(obs, biome, nightTransition);
    }

    // 5. Boss
    if (boss) {
      this.renderBoss(boss, width, groundY);
    }

    // 6. Baby Dinos Hatching Parade
    this.renderBabyDinos(babyDinos, dino.x, groundY);

    // 7. Co-Op Little Dino (Kid Dino)
    if (mode === 'family_coop' && littleDino) {
      this.renderLittleDino(littleDino, groundY, gameTime);
    }

    // 8. Particles
    for (const p of particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    // 9. Weather Particles
    this.renderWeather(weatherParticles);

    // 10. Shockwaves
    for (const sw of shockwaves) {
      ctx.strokeStyle = `rgba(56, 189, 248, ${sw.alpha * 0.8})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 11. Main Dinosaur Character (with invincibility flash if damaged)
    const isBlinking = invincibleTimer > 0 && Math.floor(gameTime * 14) % 2 === 0;
    if (!isBlinking) {
      this.renderDino(dino, groundY, activePowerUps, gameTime);
    }

    // 12. Freeze Challenge Alert Banner (Red Light / Green Light)
    if (freezeChallenge) {
      this.renderFreezeBanner(freezeChallenge, width);
    }

    // 13. Screen Flashes
    if (lightningFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${lightningFlash * 0.7})`;
      ctx.fillRect(0, 0, width, height);
    }
    if (hitFlash > 0) {
      ctx.fillStyle = `rgba(239, 68, 68, ${hitFlash * 0.4})`;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();
  }

  private renderSky(
    width: number,
    height: number,
    groundY: number,
    biome: BiomeType,
    nightTransition: number,
    stars: Star[],
    clouds: Cloud[]
  ) {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, 0, groundY);

    if (nightTransition > 0.1) {
      grad.addColorStop(0, '#020617');
      grad.addColorStop(1, '#0f172a');
    } else {
      switch (biome) {
        case 'volcano':
          grad.addColorStop(0, '#450a0a');
          grad.addColorStop(0.6, '#7f1d1d');
          grad.addColorStop(1, '#991b1b');
          break;
        case 'jungle':
          grad.addColorStop(0, '#064e3b');
          grad.addColorStop(0.7, '#065f46');
          grad.addColorStop(1, '#115e59');
          break;
        case 'cyber':
          grad.addColorStop(0, '#1e1b4b');
          grad.addColorStop(0.6, '#312e81');
          grad.addColorStop(1, '#4c1d95');
          break;
        case 'desert':
        default:
          grad.addColorStop(0, '#f8fafc');
          grad.addColorStop(0.7, '#f1f5f9');
          grad.addColorStop(1, '#e2e8f0');
          break;
      }
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    if (nightTransition > 0.1) {
      ctx.save();
      for (const s of stars) {
        ctx.fillStyle = '#ffffff';
        const twinkle = Math.sin(Date.now() * 0.003 * s.twinkleSpeed) * 0.3 + 0.7;
        ctx.globalAlpha = nightTransition * s.baseAlpha * twinkle;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      }
      ctx.restore();
    }

    if (biome === 'cyber') {
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(width - 120, 80, 30, 0, Math.PI * 2);
      ctx.fill();
    } else if (nightTransition > 0.2) {
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(width - 120, 70, 26, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = biome === 'volcano' ? '#f97316' : '#fef3c7';
      ctx.beginPath();
      ctx.arc(width - 120, 70, 24, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    for (const c of clouds) {
      ctx.fillStyle = nightTransition > 0.5 ? '#334155' : (biome === 'volcano' ? '#450a0a' : '#cbd5e1');
      ctx.globalAlpha = c.opacity * 0.6;
      this.drawPixelCloud(c.x, c.y, c.scale);
    }
    ctx.restore();
  }

  private drawPixelCloud(x: number, y: number, scale: number) {
    const ctx = this.ctx;
    const s = 4 * scale;
    ctx.fillRect(x + 12 * s, y, 20 * s, 4 * s);
    ctx.fillRect(x + 6 * s, y + 4 * s, 32 * s, 4 * s);
    ctx.fillRect(x, y + 8 * s, 44 * s, 6 * s);
  }

  private renderParallaxMountains(
    width: number,
    groundY: number,
    offset: number,
    biome: BiomeType,
    nightTransition: number
  ) {
    const ctx = this.ctx;
    ctx.save();

    let mColor = '#cbd5e1';
    if (nightTransition > 0.5) mColor = '#1e293b';
    else if (biome === 'volcano') mColor = '#7f1d1d';
    else if (biome === 'jungle') mColor = '#065f46';
    else if (biome === 'cyber') mColor = '#3b0764';

    ctx.fillStyle = mColor;
    ctx.globalAlpha = 0.5;

    const mesaWidth = 260;
    const startX = -((offset * 0.15) % mesaWidth);

    ctx.beginPath();
    ctx.moveTo(0, groundY);
    for (let x = startX - mesaWidth; x < width + mesaWidth; x += mesaWidth) {
      ctx.lineTo(x, groundY);
      ctx.lineTo(x + 40, groundY - 35);
      ctx.lineTo(x + 120, groundY - 45);
      ctx.lineTo(x + 180, groundY - 20);
      ctx.lineTo(x + 220, groundY);
    }
    ctx.lineTo(width, groundY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private renderGround(
    width: number,
    groundY: number,
    offset: number,
    biome: BiomeType,
    nightTransition: number
  ) {
    const ctx = this.ctx;
    ctx.save();

    let strokeColor = '#475569';
    let fillColor = '#e2e8f0';

    if (nightTransition > 0.5) {
      strokeColor = '#64748b';
      fillColor = '#0f172a';
    } else if (biome === 'volcano') {
      strokeColor = '#f97316';
      fillColor = '#18181b';
    } else if (biome === 'jungle') {
      strokeColor = '#10b981';
      fillColor = '#022c22';
    } else if (biome === 'cyber') {
      strokeColor = '#06b6d4';
      fillColor = '#0f172a';
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.stroke();

    const patternWidth = 600;
    const xBase = -((offset * 1.0) % patternWidth);
    ctx.fillStyle = strokeColor;
    for (let i = 0; i < 35; i++) {
      const px = ((i * 37 + xBase) % (width + 100)) - 50;
      const py = groundY + 8 + (i % 5) * 4;
      const pLen = 4 + (i % 4) * 5;
      ctx.fillRect(px, py, pLen, 2);
    }

    ctx.fillStyle = fillColor;
    ctx.fillRect(0, groundY + 2, width, 160);
    ctx.restore();
  }

  private renderWeather(weatherParticles: WeatherParticle[]) {
    const ctx = this.ctx;
    ctx.save();
    for (const wp of weatherParticles) {
      ctx.strokeStyle = wp.color;
      ctx.globalAlpha = wp.alpha;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(wp.x, wp.y);
      ctx.lineTo(wp.x - 3, wp.y + wp.length);
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderDino(
    dino: {
      x: number;
      y: number;
      width: number;
      height: number;
      isJumping: boolean;
      isDucking: boolean;
      isGliding: boolean;
      runFrame: number;
      squashX: number;
      squashY: number;
      isDead: boolean;
      skin: DinoSkinConfig;
      accessory: AccessoryType;
    },
    groundY: number,
    activePowerUps: Map<PowerUpType, ActivePowerUp>,
    gameTime: number
  ) {
    const ctx = this.ctx;
    ctx.save();

    const cx = dino.x + dino.width / 2;
    const cy = dino.y + dino.height;

    ctx.translate(cx, cy);
    ctx.scale(dino.squashX, dino.squashY);
    ctx.translate(-cx, -cy);

    // Shadow
    const altitude = groundY - (dino.y + dino.height);
    const shadowScale = Math.max(0.3, 1 - altitude / 200);
    const shadowAlpha = Math.max(0.1, 0.35 - altitude / 250);
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(cx, groundY + 4, (dino.width / 2) * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wings
    if (activePowerUps.has('wings')) {
      const wingFlap = Math.sin(gameTime * 18) * 8;
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(dino.x + 14, dino.y + 20);
      ctx.lineTo(dino.x - 18, dino.y - 12 + wingFlap);
      ctx.lineTo(dino.x + 4, dino.y + 12);
      ctx.closePath();
      ctx.fill();
    }

    // Superhero Cape (behind body)
    if (dino.accessory === 'superhero_cape') {
      const capeWave = Math.sin(gameTime * 16) * 6;
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(dino.x + 18, dino.y + 20);
      ctx.lineTo(dino.x - 24, dino.y + 28 + capeWave);
      ctx.lineTo(dino.x - 18, dino.y + 40 + capeWave);
      ctx.lineTo(dino.x + 16, dino.y + 32);
      ctx.closePath();
      ctx.fill();
    }

    // Body
    if (dino.isDucking) {
      this.drawDuckingDino(dino.x, dino.y, dino.width, dino.height, dino.runFrame, dino.skin, dino.isDead);
    } else {
      this.drawStandingDino(
        dino.x,
        dino.y,
        dino.width,
        dino.height,
        dino.isJumping,
        dino.runFrame,
        dino.skin,
        dino.isDead
      );
    }

    // Accessories
    this.drawAccessory(dino.accessory, dino.x, dino.y, dino.isDucking, gameTime);

    // Shield Aura
    if (activePowerUps.has('shield')) {
      const shieldPulse = Math.sin(gameTime * 6) * 3;
      const sRadius = Math.max(dino.width, dino.height) * 0.75 + shieldPulse;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.beginPath();
      ctx.arc(cx, cy - dino.height / 2, sRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  // --- Render Baby Dinos Parade ---
  private renderBabyDinos(babyDinos: BabyDino[], parentX: number, groundY: number) {
    const ctx = this.ctx;

    for (const baby of babyDinos) {
      const bx = parentX - baby.xOffset;
      const by = groundY - 22 - (baby.hopY || 0);

      ctx.save();
      ctx.fillStyle = baby.color;

      // Baby cute round body
      ctx.beginPath();
      ctx.arc(bx + 10, by + 10, 8, 0, Math.PI * 2);
      ctx.fill();

      // Baby head
      ctx.beginPath();
      ctx.arc(bx + 16, by + 4, 6, 0, Math.PI * 2);
      ctx.fill();

      // Big cute baby eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(bx + 17, by + 3, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(bx + 17.5, by + 3, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Baby legs
      ctx.fillStyle = baby.color;
      ctx.fillRect(bx + 6, by + 16, 3, 6);
      ctx.fillRect(bx + 12, by + 16, 3, 6);

      // Cute feature based on baby type
      if (baby.type === 'baby_tricera') {
        // Frill
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(bx + 12, by - 2, 4, 4);
      } else if (baby.type === 'baby_stego') {
        // Back plates
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(bx + 6, by, 3, 3);
        ctx.fillRect(bx + 11, by, 3, 3);
      }

      ctx.restore();
    }
  }

  // --- Render Co-Op Little Dino (Kid Dino) ---
  private renderLittleDino(
    little: { x: number; y: number; width: number; height: number; isJumping: boolean },
    groundY: number,
    gameTime: number
  ) {
    const ctx = this.ctx;
    ctx.save();

    const lx = little.x;
    const ly = little.y;

    // Golden kid dino
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(lx + 10, ly + 4, 18, 14); // head
    ctx.fillRect(lx + 4, ly + 14, 18, 16); // body
    ctx.fillRect(lx, ly + 18, 6, 6); // tail

    // Cute eye
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(lx + 18, ly + 6, 5, 5);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(lx + 20, ly + 7, 2.5, 3);

    // Legs
    ctx.fillStyle = '#d97706';
    if (little.isJumping) {
      ctx.fillRect(lx + 6, ly + 28, 4, 6);
      ctx.fillRect(lx + 14, ly + 28, 4, 6);
    } else {
      const legFrame = Math.floor(gameTime * 12) % 2;
      ctx.fillRect(lx + 6 + legFrame * 4, ly + 28, 4, 10);
      ctx.fillRect(lx + 14 - legFrame * 4, ly + 28, 4, 10);
    }

    // Party hat on Little Dino!
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.moveTo(lx + 14, ly + 4);
    ctx.lineTo(lx + 18, ly - 6);
    ctx.lineTo(lx + 22, ly + 4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // --- Render Freeze Challenge Banner (Red Light / Green Light) ---
  private renderFreezeBanner(fc: FreezeChallenge, width: number) {
    const ctx = this.ctx;
    ctx.save();

    const isFailed = fc.motionDetectedDuringFreeze;
    const bgCol = isFailed ? 'rgba(239, 68, 68, 0.9)' : 'rgba(14, 165, 233, 0.9)';

    ctx.fillStyle = bgCol;
    ctx.fillRect(width / 2 - 200, 48, 400, 44);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(width / 2 - 200, 48, 400, 44);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';

    if (fc.passed) {
      ctx.fillText('🌟 PERFECT STATUE! +200 PTS! 🌟', width / 2, 74);
    } else if (isFailed) {
      ctx.fillText('👀 WIGGLES DETECTED! SNORE! 👀', width / 2, 74);
    } else {
      ctx.fillText('❄️ FREEZE LIKE A STATUE! DON\'T MOVE! ❄️', width / 2, 68);
      // Countdown progress bar
      const progress = Math.max(0, fc.timer / fc.maxTimer);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(width / 2 - 180, 78, 360 * progress, 6);
    }

    ctx.restore();
  }

  private drawStandingDino(
    x: number,
    y: number,
    w: number,
    h: number,
    isJumping: boolean,
    runFrame: number,
    skin: DinoSkinConfig,
    isDead: boolean
  ) {
    const ctx = this.ctx;
    ctx.fillStyle = skin.primaryColor;

    ctx.fillRect(x + 22, y + 2, 28, 20);
    ctx.fillRect(x + 40, y + 8, 16, 14);
    ctx.fillRect(x + 14, y + 20, 28, 24);

    ctx.fillRect(x + 6, y + 24, 10, 14);
    ctx.fillRect(x, y + 28, 8, 8);
    ctx.fillRect(x - 4, y + 32, 6, 4);

    ctx.fillStyle = skin.secondaryColor;
    ctx.fillRect(x + 36, y + 28, 10, 4);
    ctx.fillRect(x + 44, y + 30, 4, 6);

    if (isDead) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + 30, y + 6);
      ctx.lineTo(x + 36, y + 12);
      ctx.moveTo(x + 36, y + 6);
      ctx.lineTo(x + 30, y + 12);
      ctx.stroke();
    } else {
      ctx.fillStyle = skin.eyeColor;
      ctx.fillRect(x + 30, y + 6, 7, 7);
      ctx.fillStyle = skin.accentColor;
      ctx.fillRect(x + 34, y + 7, 3, 5);
      if (skin.id === 'cyber') {
        ctx.fillStyle = skin.accentColor;
        ctx.fillRect(x + 24, y + 8, 26, 3);
      }
    }

    ctx.fillStyle = skin.primaryColor;
    if (isJumping) {
      ctx.fillRect(x + 18, y + 44, 8, 8);
      ctx.fillRect(x + 24, y + 50, 8, 6);
      ctx.fillRect(x + 28, y + 44, 8, 8);
      ctx.fillRect(x + 34, y + 50, 8, 6);
    } else {
      if (runFrame === 0) {
        ctx.fillRect(x + 28, y + 44, 6, 18);
        ctx.fillRect(x + 28, y + 60, 10, 4);
        ctx.fillRect(x + 16, y + 44, 6, 12);
        ctx.fillRect(x + 12, y + 54, 8, 4);
      } else {
        ctx.fillRect(x + 18, y + 44, 6, 18);
        ctx.fillRect(x + 18, y + 60, 10, 4);
        ctx.fillRect(x + 28, y + 44, 6, 12);
        ctx.fillRect(x + 24, y + 54, 8, 4);
      }
    }
  }

  private drawDuckingDino(
    x: number,
    y: number,
    w: number,
    h: number,
    runFrame: number,
    skin: DinoSkinConfig,
    isDead: boolean
  ) {
    const ctx = this.ctx;
    ctx.fillStyle = skin.primaryColor;

    ctx.fillRect(x + 14, y + 10, 38, 18);
    ctx.fillRect(x + 50, y + 4, 24, 16);
    ctx.fillRect(x + 68, y + 10, 8, 10);
    ctx.fillRect(x, y + 14, 16, 10);
    ctx.fillRect(x - 4, y + 16, 6, 6);

    if (isDead) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 56, y + 7);
      ctx.lineTo(x + 62, y + 13);
      ctx.moveTo(x + 62, y + 7);
      ctx.lineTo(x + 56, y + 13);
      ctx.stroke();
    } else {
      ctx.fillStyle = skin.eyeColor;
      ctx.fillRect(x + 56, y + 7, 6, 6);
      ctx.fillStyle = skin.accentColor;
      ctx.fillRect(x + 59, y + 8, 3, 4);
    }

    ctx.fillStyle = skin.secondaryColor;
    if (runFrame === 0) {
      ctx.fillRect(x + 22, y + 26, 6, 10);
      ctx.fillRect(x + 22, y + 34, 8, 4);
      ctx.fillRect(x + 38, y + 26, 6, 8);
      ctx.fillRect(x + 34, y + 32, 8, 4);
    } else {
      ctx.fillRect(x + 38, y + 26, 6, 10);
      ctx.fillRect(x + 38, y + 34, 8, 4);
      ctx.fillRect(x + 22, y + 26, 6, 8);
      ctx.fillRect(x + 18, y + 32, 8, 4);
    }
  }

  private drawAccessory(
    acc: AccessoryType,
    x: number,
    y: number,
    isDucking: boolean,
    gameTime: number
  ) {
    const ctx = this.ctx;
    if (acc === 'none') return;

    const headX = isDucking ? x + 56 : x + 30;
    const headY = isDucking ? y + 4 : y + 4;

    switch (acc) {
      case 'propeller_hat': {
        // Multi-colored beanie
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(headX - 6, headY - 4, 18, 5);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(headX - 2, headY - 8, 10, 4);
        // Spinning propeller
        const propAngle = gameTime * 25;
        const propWidth = Math.cos(propAngle) * 12;
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(headX + 3 - propWidth, headY - 11);
        ctx.lineTo(headX + 3 + propWidth, headY - 11);
        ctx.stroke();
        break;
      }
      case 'party_hat': {
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.moveTo(headX - 4, headY - 2);
        ctx.lineTo(headX + 4, headY - 18);
        ctx.lineTo(headX + 12, headY - 2);
        ctx.closePath();
        ctx.fill();
        // Yellow pom-pom
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(headX + 4, headY - 19, 3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'sunglasses':
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(headX - 4, headY + 3, 16, 6);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(headX - 2, headY + 4, 4, 3);
        ctx.fillRect(headX + 5, headY + 4, 4, 3);
        break;
      case 'crown':
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.moveTo(headX - 6, headY - 2);
        ctx.lineTo(headX - 6, headY - 14);
        ctx.lineTo(headX - 1, headY - 8);
        ctx.lineTo(headX + 4, headY - 16);
        ctx.lineTo(headX + 9, headY - 8);
        ctx.lineTo(headX + 14, headY - 14);
        ctx.lineTo(headX + 14, headY - 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(headX + 2, headY - 7, 4, 4);
        break;
      case 'goggles':
        ctx.fillStyle = '#b45309';
        ctx.fillRect(headX - 4, headY - 2, 18, 6);
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(headX - 2, headY - 1, 5, 4);
        ctx.fillRect(headX + 6, headY - 1, 5, 4);
        break;
      case 'headband':
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(headX - 6, headY + 2, 22, 5);
        ctx.fillRect(headX - 14, headY + 4, 10, 4);
        break;
    }
  }

  private renderBoss(boss: Boss, width: number, groundY: number) {
    const ctx = this.ctx;
    ctx.save();

    if (boss.state === 'telegraph') {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
      ctx.fillRect(width / 2 - 180, 50, 360, 32);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(width / 2 - 180, 50, 360, 32);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(boss.warningTelegraph, width / 2, 71);
    } else {
      const bx = boss.x;
      const by = boss.y;

      if (boss.type === 'titan_pterodactyl') {
        ctx.fillStyle = '#701a75';
        ctx.fillRect(bx + 20, by + 20, 60, 25);
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(bx - 10, by + 22, 30, 14);
        ctx.fillStyle = '#e11d48';
        ctx.fillRect(bx + 40, by + 4, 30, 16);
        const bWing = Math.sin(Date.now() * 0.01) * 20;
        ctx.fillStyle = '#86198f';
        ctx.fillRect(bx + 25, by - 20 + bWing, 45, 24);
        ctx.fillRect(bx + 25, by + 40 - bWing, 45, 24);
      } else {
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(bx + 15, by + 20, 70, 45);
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(bx + 50, by + 20, 35, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#450a0a';
        ctx.fillRect(bx - 15, by + 30, 35, 25);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx - 10, by + 42, 6, 8);
        ctx.fillRect(bx, by + 42, 6, 8);
      }
    }

    ctx.restore();
  }

  private renderObstacle(obs: Obstacle, biome: BiomeType, nightTransition: number) {
    const ctx = this.ctx;
    ctx.save();

    if (obs.type === 'egg_collectible') {
      this.drawEggCollectible(obs.x, obs.y, obs.animTimer);
    } else if (obs.type === 'heart_collectible') {
      this.drawHeartCollectible(obs.x, obs.y, obs.animTimer);
    } else if (obs.type.startsWith('powerup_')) {
      this.drawPowerUpItem(obs.type as PowerUpType, obs.x, obs.y, obs.animTimer);
    } else if (obs.type.startsWith('cactus')) {
      this.drawCactus(obs.x, obs.y, obs.width, obs.height, obs.type, biome, nightTransition);
    } else if (obs.type.startsWith('pterodactyl')) {
      this.drawPterodactyl(obs.x, obs.y, obs.width, obs.height, obs.animFrame, nightTransition);
    }

    ctx.restore();
  }

  private drawHeartCollectible(x: number, y: number, timer: number) {
    const ctx = this.ctx;
    const hoverY = Math.sin(timer * 6) * 4;

    ctx.save();
    ctx.translate(x + 14, y + 14 + hoverY);

    // Glow
    ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    // Heart Shape
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(0, 3);
    ctx.bezierCurveTo(-6, -6, -12, 1, 0, 12);
    ctx.bezierCurveTo(12, 1, 6, -6, 0, 3);
    ctx.fill();

    ctx.restore();
  }

  private drawPowerUpItem(typeStr: string, x: number, y: number, timer: number) {
    const ctx = this.ctx;
    const type = typeStr.replace('powerup_', '');
    const hoverY = Math.sin(timer * 5) * 4;

    ctx.save();
    ctx.translate(x + 16, y + 16 + hoverY);

    const haloGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 24);
    haloGrad.addColorStop(0, 'rgba(56, 189, 248, 0.5)');
    haloGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (type === 'shield') ctx.fillText('🛡️', 0, 0);
    else if (type === 'wings') ctx.fillText('🪽', 0, 0);
    else if (type === 'magnet') ctx.fillText('🧲', 0, 0);
    else ctx.fillText('2X', 0, 0);

    ctx.restore();
  }

  private drawCactus(
    x: number,
    y: number,
    w: number,
    h: number,
    type: ObstacleType,
    biome: BiomeType,
    nightTransition: number
  ) {
    const ctx = this.ctx;
    let bodyColor = '#166534';
    let highlight = '#4ade80';

    if (nightTransition > 0.5) {
      bodyColor = '#15803d';
      highlight = '#22c55e';
    } else if (biome === 'volcano') {
      bodyColor = '#7f1d1d';
      highlight = '#f97316';
    } else if (biome === 'cyber') {
      bodyColor = '#065f46';
      highlight = '#2dd4bf';
    }

    ctx.fillStyle = bodyColor;
    if (type === 'cactus_small') {
      ctx.fillRect(x + 8, y, 10, h);
      ctx.fillRect(x, y + 14, 8, 6);
      ctx.fillRect(x, y + 8, 6, 8);
      ctx.fillRect(x + 18, y + 18, 8, 6);
      ctx.fillRect(x + 20, y + 12, 6, 8);
      ctx.fillStyle = highlight;
      ctx.fillRect(x + 11, y + 4, 2, h - 8);
    } else if (type === 'cactus_double') {
      ctx.fillRect(x + 4, y + 10, 8, h - 10);
      ctx.fillRect(x + 20, y, 9, h);
      ctx.fillRect(x + 29, y + 14, 6, 5);
    } else {
      ctx.fillRect(x + 14, y, 14, h);
      ctx.fillRect(x, y + 20, 14, 8);
      ctx.fillRect(x + 28, y + 26, 14, 8);
      ctx.fillStyle = highlight;
      ctx.fillRect(x + 18, y + 4, 2, h - 8);
    }
  }

  private drawPterodactyl(
    x: number,
    y: number,
    w: number,
    h: number,
    animFrame: number,
    nightTransition: number
  ) {
    const ctx = this.ctx;
    ctx.fillStyle = nightTransition > 0.5 ? '#9333ea' : '#7c3aed';

    ctx.fillRect(x + 18, y + 14, 22, 10);
    ctx.fillRect(x + 6, y + 8, 16, 8);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x, y + 10, 8, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 10, y + 9, 3, 3);

    ctx.fillStyle = '#7c3aed';
    if (animFrame === 0) {
      ctx.fillRect(x + 20, y, 14, 16);
      ctx.fillRect(x + 26, y - 6, 10, 8);
    } else {
      ctx.fillRect(x + 20, y + 22, 14, 14);
      ctx.fillRect(x + 26, y + 32, 10, 8);
    }
  }

  private drawEggCollectible(x: number, y: number, animTimer: number) {
    const ctx = this.ctx;
    const hoverY = Math.sin(animTimer * 5) * 4;

    const haloGrad = ctx.createRadialGradient(x + 14, y + 14 + hoverY, 4, x + 14, y + 14 + hoverY, 24);
    haloGrad.addColorStop(0, 'rgba(250, 204, 21, 0.45)');
    haloGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(x + 14, y + 14 + hoverY, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.ellipse(x + 14, y + 14 + hoverY, 11, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(x + 10, y + 10 + hoverY, 3, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

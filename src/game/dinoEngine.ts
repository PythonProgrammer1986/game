import {
  AccessoryType,
  ActivePowerUp,
  BabyDino,
  BabyDinoType,
  BiomeType,
  Boss,
  BoundingBox,
  Cloud,
  DinoSkinConfig,
  FreezeChallenge,
  GameMode,
  GameState,
  Obstacle,
  ObstacleType,
  Particle,
  PowerUpType,
  Shockwave,
  Star,
  WeatherParticle,
  WorkoutReport,
} from './types';
import { sound } from '../utils/audio';
import { cheerVoice } from '../utils/speech';

export interface DinoEngineConfig {
  width: number;
  height: number;
  skin: DinoSkinConfig;
  accessory: AccessoryType;
  mode: GameMode;
  onGameOver: (report: WorkoutReport) => void;
  onScoreMilestone?: (milestone: number) => void;
  onEggCollected?: () => void;
  onPowerUpCollected?: (type: PowerUpType) => void;
  onBossEncounter?: (name: string) => void;
  onBabyDinoHatched?: (baby: BabyDino) => void;
}

export class DinoEngine {
  public width: number;
  public height: number;
  public groundY: number;

  // Dino state
  public dino = {
    x: 80,
    y: 0,
    vy: 0,
    width: 58,
    height: 64,
    standHeight: 64,
    duckHeight: 36,
    isGrounded: true,
    isJumping: false,
    isDucking: false,
    isGliding: false,
    runFrame: 0,
    runTimer: 0,
    squashX: 1,
    squashY: 1,
    isDead: false,
    skin: null as unknown as DinoSkinConfig,
    accessory: 'none' as AccessoryType,
  };

  // Co-Op Little Dino (Kid Dino)
  public littleDino = {
    x: 40,
    y: 0,
    vy: 0,
    width: 38,
    height: 42,
    isGrounded: true,
    isJumping: false,
    squashX: 1,
    squashY: 1,
  };

  // Simulation parameters
  private gravity: number = 2200;
  private baseJumpSpeed: number = -780;
  private baseSpeed: number = 380;
  public currentSpeed: number = 380;
  private maxSpeed: number = 920;

  public mode: GameMode = 'kid_adventure';
  public state: GameState = 'title';

  // Kid-Friendly Hearts & Lives
  public lives: number = 3;
  public maxLives: number = 3;
  public invincibleTimer: number = 0;

  // Dino Battery (0 to 100)
  public dinoBattery: number = 85;

  // Baby Dino Hatching Parade
  public babyDinos: BabyDino[] = [];
  private jumpsSinceLastHatch: number = 0;
  public babyDinosHatchedTotal: number = 0;

  // Freeze Challenge (Red Light / Green Light)
  public freezeChallenge: FreezeChallenge | null = null;
  private nextFreezeDistance: number = 750;
  public freezeChallengesPassed: number = 0;

  // Jump buffering & coyote time
  private jumpBufferTimer: number = 0;
  private coyoteTimer: number = 0;

  // World objects
  public obstacles: Obstacle[] = [];
  public particles: Particle[] = [];
  public weatherParticles: WeatherParticle[] = [];
  public clouds: Cloud[] = [];
  public stars: Star[] = [];
  public shockwaves: Shockwave[] = [];
  public groundOffset: number = 0;

  // Power-Ups
  public activePowerUps: Map<PowerUpType, ActivePowerUp> = new Map();
  public hasShield: boolean = false;

  // Roar / Shockwave ability
  public roarReady: boolean = true;
  public roarCooldownTimer: number = 0;
  private readonly roarCooldownMax: number = 4.5;

  // Boss Encounter State
  public boss: Boss | null = null;
  private nextBossScore: number = 900;

  // Biome & Weather
  public currentBiome: BiomeType = 'desert';
  public lightningFlash: number = 0;

  // Timers & counters
  public score: number = 0;
  public distanceMeters: number = 0;
  public gameTime: number = 0;
  public physicalJumps: number = 0;
  public totalJumps: number = 0;
  public eggsCollected: number = 0;
  public caloriesBurned: number = 0;
  public peakJumpIntensity: number = 1.0;

  // Spawning
  private nextObstacleDistance: number = 600;
  private nextPowerUpDistance: number = 1000;
  private nextEggDistance: number = 800;
  private nextHeartDistance: number = 1800;
  private obstacleIdCounter: number = 0;

  // Night cycle transition (0 to 1)
  public nightTransition: number = 0;

  // Game feel
  public screenShake = { x: 0, y: 0 };
  private shakeMagnitude: number = 0;
  public hitFlash: number = 0;
  private hitstopTimer: number = 0;

  // External tracking input from camera
  public isCameraFrozenStill: boolean = true;

  // Callbacks
  private onGameOverCb: (report: WorkoutReport) => void;
  private onScoreMilestoneCb?: (milestone: number) => void;
  private onEggCollectedCb?: () => void;
  private onPowerUpCollectedCb?: (type: PowerUpType) => void;
  private onBossEncounterCb?: (name: string) => void;
  private onBabyDinoHatchedCb?: (baby: BabyDino) => void;

  constructor(config: DinoEngineConfig) {
    this.width = config.width;
    this.height = config.height;
    this.groundY = config.height - 70;
    this.dino.skin = config.skin;
    this.dino.accessory = config.accessory;
    this.mode = config.mode;
    this.onGameOverCb = config.onGameOver;
    this.onScoreMilestoneCb = config.onScoreMilestone;
    this.onEggCollectedCb = config.onEggCollected;
    this.onPowerUpCollectedCb = config.onPowerUpCollected;
    this.onBossEncounterCb = config.onBossEncounter;
    this.onBabyDinoHatchedCb = config.onBabyDinoHatched;

    this.dino.y = this.groundY - this.dino.height;
    this.littleDino.y = this.groundY - this.littleDino.height;

    this.initAtmosphere();
  }

  public setDimensions(w: number, h: number) {
    this.width = w;
    this.height = h;
    this.groundY = h - 70;
    if (this.dino.isGrounded) {
      this.dino.y = this.groundY - (this.dino.isDucking ? this.dino.duckHeight : this.dino.standHeight);
    }
    if (this.littleDino.isGrounded) {
      this.littleDino.y = this.groundY - this.littleDino.height;
    }
  }

  public setSkin(skin: DinoSkinConfig) {
    this.dino.skin = skin;
  }

  public setAccessory(acc: AccessoryType) {
    this.dino.accessory = acc;
  }

  public setMode(mode: GameMode) {
    this.mode = mode;
    if (mode === 'kid_adventure' || mode === 'family_coop') {
      this.lives = 3;
      this.maxLives = 3;
    } else {
      this.lives = 1;
      this.maxLives = 1;
    }
  }

  private initAtmosphere() {
    this.clouds = [];
    for (let i = 0; i < 6; i++) {
      this.clouds.push({
        x: Math.random() * this.width,
        y: 40 + Math.random() * (this.groundY - 140),
        speed: 15 + Math.random() * 25,
        scale: 0.8 + Math.random() * 0.6,
        opacity: 0.6 + Math.random() * 0.4,
      });
    }

    this.stars = [];
    for (let i = 0; i < 40; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: 10 + Math.random() * (this.groundY - 60),
        size: Math.random() > 0.7 ? 3 : 2,
        twinkleSpeed: 0.6 + Math.random() * 1.5,
        baseAlpha: 0.4 + Math.random() * 0.6,
      });
    }

    this.weatherParticles = [];
  }

  public reset() {
    this.state = 'playing';
    this.dino.y = this.groundY - this.dino.standHeight;
    this.dino.vy = 0;
    this.dino.isGrounded = true;
    this.dino.isJumping = false;
    this.dino.isDucking = false;
    this.dino.isGliding = false;
    this.dino.height = this.dino.standHeight;
    this.dino.squashX = 1;
    this.dino.squashY = 1;
    this.dino.isDead = false;

    this.littleDino.y = this.groundY - this.littleDino.height;
    this.littleDino.vy = 0;
    this.littleDino.isGrounded = true;

    this.currentSpeed = this.baseSpeed;
    this.score = 0;
    this.distanceMeters = 0;
    this.gameTime = 0;
    this.physicalJumps = 0;
    this.totalJumps = 0;
    this.eggsCollected = 0;
    this.caloriesBurned = 0;
    this.peakJumpIntensity = 1.0;

    // Reset lives
    const isKidMode = this.mode === 'kid_adventure' || this.mode === 'family_coop';
    this.lives = isKidMode ? 3 : 1;
    this.maxLives = isKidMode ? 3 : 1;
    this.invincibleTimer = 0;
    this.dinoBattery = 90;

    // Reset baby dinos
    this.babyDinos = [];
    this.jumpsSinceLastHatch = 0;
    this.babyDinosHatchedTotal = 0;

    // Reset freeze
    this.freezeChallenge = null;
    this.nextFreezeDistance = 800;
    this.freezeChallengesPassed = 0;

    this.obstacles = [];
    this.particles = [];
    this.shockwaves = [];
    this.weatherParticles = [];
    this.activePowerUps.clear();
    this.hasShield = false;
    this.boss = null;
    this.nextBossScore = 900;
    this.currentBiome = 'desert';

    this.groundOffset = 0;
    this.nextObstacleDistance = 650;
    this.nextPowerUpDistance = 1000;
    this.nextEggDistance = 700;
    this.nextHeartDistance = 1800;
    this.nightTransition = 0;
    this.shakeMagnitude = 0;
    this.screenShake = { x: 0, y: 0 };
    this.hitFlash = 0;
    this.hitstopTimer = 0;
    this.roarReady = true;
    this.roarCooldownTimer = 0;

    sound.startMusic();
  }

  // --- Dynamic Jump & Family Co-Op Leap ---
  public triggerJump(isPhysical: boolean = false, intensity: number = 1.0) {
    if (this.state !== 'playing' || this.dino.isDead) return;

    this.jumpBufferTimer = 0.14;

    if (intensity > this.peakJumpIntensity) {
      this.peakJumpIntensity = intensity;
    }

    const canJump = this.dino.isGrounded || this.coyoteTimer > 0;
    if (canJump) {
      this.performJump(isPhysical, intensity);
    } else if (this.activePowerUps.has('wings') && !this.dino.isGrounded) {
      this.dino.vy = -180;
      this.dino.isGliding = true;
    }
  }

  private performJump(isPhysical: boolean, intensity: number) {
    const jumpScale = isPhysical ? Math.min(1.35, Math.max(0.85, 0.75 + intensity * 0.35)) : 1.0;
    this.dino.vy = this.baseJumpSpeed * jumpScale;
    this.dino.isGrounded = false;
    this.dino.isJumping = true;
    this.dino.isGliding = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;

    // Co-op Little Dino leaps too!
    if (this.mode === 'family_coop') {
      this.littleDino.vy = this.baseJumpSpeed * jumpScale * 0.95;
      this.littleDino.isGrounded = false;
      this.littleDino.isJumping = true;
    }

    this.dino.squashX = 0.82;
    this.dino.squashY = 1.28;

    // Recharges Dino Battery!
    this.dinoBattery = Math.min(100, this.dinoBattery + 18);

    sound.playJump(isPhysical, intensity);
    this.totalJumps++;

    if (isPhysical) {
      this.physicalJumps++;
      this.jumpsSinceLastHatch++;
      this.caloriesBurned += 0.22 * intensity;

      // Cheer speech feedback
      cheerVoice.cheerJump(this.physicalJumps);

      // Check if baby dino should hatch! (Every 8 physical jumps)
      if (this.jumpsSinceLastHatch >= 8) {
        this.hatchBabyDino();
        this.jumpsSinceLastHatch = 0;
      }

      // Check sprint50 completion
      if (this.mode === 'sprint50' && this.physicalJumps >= 50) {
        this.completeWorkout(true);
        return;
      }
    } else {
      this.caloriesBurned += 0.005;
    }

    // Dust particles
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: this.dino.x + 20 + Math.random() * 20,
        y: this.groundY - 4,
        vx: -60 - Math.random() * 120,
        vy: -20 - Math.random() * 40,
        size: 3 + Math.random() * 3,
        color: this.dino.skin.particleColor,
        alpha: 0.9,
        life: 0,
        maxLife: 0.35,
        gravity: 120,
      });
    }
  }

  // --- Baby Dinosaur Hatching Parade ---
  private hatchBabyDino() {
    const types: BabyDinoType[] = ['baby_trex', 'baby_tricera', 'baby_stego', 'baby_bronto'];
    const names = ['T-Rex', 'Triceratops', 'Stegosaurus', 'Brontosaurus'];
    const colors = ['#10b981', '#f59e0b', '#06b6d4', '#ec4899'];
    const idx = this.babyDinos.length % types.length;

    const baby: BabyDino = {
      id: Date.now() + Math.random(),
      type: types[idx],
      name: names[idx],
      color: colors[idx],
      xOffset: 45 + this.babyDinos.length * 32, // conga line behind
      jumpDelay: 0.12 * (this.babyDinos.length + 1),
      hopY: 0,
    };

    this.babyDinos.push(baby);
    this.babyDinosHatchedTotal++;
    this.score += 150;

    sound.playScoreMilestone();
    cheerVoice.cheerHatch(baby.name);

    if (this.onBabyDinoHatchedCb) {
      this.onBabyDinoHatchedCb(baby);
    }
  }

  // --- T-Rex Foot Stomp ---
  public triggerStomp() {
    if (this.state !== 'playing' || this.dino.isDead) return;

    sound.playCollision();
    this.shakeMagnitude = 12;

    // Stomp shockwave
    this.shockwaves.push({
      x: this.dino.x + 20,
      y: this.groundY - 5,
      radius: 10,
      maxRadius: 240,
      alpha: 1,
    });

    // Clear low cacti near dino
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      if (obs.type === 'cactus_small' || obs.type === 'cactus_double') {
        const dist = Math.abs(obs.x - this.dino.x);
        if (dist < 260) {
          this.obstacles.splice(i, 1);
          for (let p = 0; p < 8; p++) {
            this.particles.push({
              x: obs.x + 12,
              y: obs.y + 12,
              vx: (Math.random() - 0.5) * 160,
              vy: -60 - Math.random() * 120,
              size: 3 + Math.random() * 3,
              color: '#16a34a',
              alpha: 1,
              life: 0,
              maxLife: 0.4,
              gravity: 400,
            });
          }
        }
      }
    }
  }

  public setDucking(isDucking: boolean) {
    if (this.state !== 'playing' || this.dino.isDead) return;

    if (this.dino.isDucking !== isDucking) {
      this.dino.isDucking = isDucking;
      if (isDucking) {
        sound.playDuck();
        this.dino.height = this.dino.duckHeight;
        if (this.dino.isGrounded) {
          this.dino.y = this.groundY - this.dino.duckHeight;
        }
      } else {
        this.dino.height = this.dino.standHeight;
        if (this.dino.isGrounded) {
          this.dino.y = this.groundY - this.dino.standHeight;
        }
      }
    }
  }

  // --- Dinosaur Roar / Shockwave Ability ---
  public triggerRoar() {
    if (this.state !== 'playing' || this.dino.isDead || !this.roarReady) return;

    this.roarReady = false;
    this.roarCooldownTimer = this.roarCooldownMax;
    sound.playRoar();

    this.shakeMagnitude = 14;
    this.shockwaves.push({
      x: this.dino.x + 30,
      y: this.dino.y + 30,
      radius: 20,
      maxRadius: 360,
      alpha: 1,
    });

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      if (obs.type !== 'egg_collectible' && obs.type !== 'heart_collectible' && !obs.type.startsWith('powerup_')) {
        const dist = Math.abs(obs.x - (this.dino.x + 30));
        if (dist < 340) {
          this.obstacles.splice(i, 1);
          for (let p = 0; p < 12; p++) {
            this.particles.push({
              x: obs.x + 16,
              y: obs.y + 16,
              vx: (Math.random() - 0.5) * 240,
              vy: -80 - Math.random() * 160,
              size: 4 + Math.random() * 4,
              color: '#f59e0b',
              alpha: 1,
              life: 0,
              maxLife: 0.5,
              gravity: 500,
            });
          }
        }
      }
    }
  }

  // --- Main Update Loop ---
  public update(rawDt: number) {
    if (this.state !== 'playing') return;

    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= rawDt;
      return;
    }

    const dt = Math.min(rawDt, 0.05);
    this.gameTime += dt;

    // Invincibility countdown after getting hit in Kid Mode
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
    }

    // Dino Battery drain (slow decay encourages child to keep hopping!)
    this.dinoBattery = Math.max(10, this.dinoBattery - dt * 3.5);

    // Roar cooldown
    if (!this.roarReady) {
      this.roarCooldownTimer -= dt;
      if (this.roarCooldownTimer <= 0) {
        this.roarReady = true;
      }
    }

    // Speed curve (tied gently to Dino Battery!)
    const batteryBoost = 0.85 + (this.dinoBattery / 100) * 0.35;
    const speedMultiplier = (1.0 + Math.sqrt(this.distanceMeters) * 0.02) * batteryBoost;
    this.currentSpeed = Math.min(this.maxSpeed, this.baseSpeed * speedMultiplier);
    sound.setSpeedTempo(this.currentSpeed / this.baseSpeed);

    // Distance & Score
    const deltaDist = this.currentSpeed * dt;
    this.distanceMeters += deltaDist * 0.04;
    this.groundOffset += deltaDist;

    const multiplier = this.activePowerUps.has('multiplier') ? 2 : 1;
    const prevScore = this.score;
    this.score = Math.floor((this.distanceMeters + this.eggsCollected * 50 + this.babyDinos.length * 100) * multiplier);

    if (Math.floor(this.score / 100) > Math.floor(prevScore / 100)) {
      sound.playScoreTick();
      if (this.score > 0 && this.score % 500 < 10) {
        sound.playScoreMilestone();
        if (this.onScoreMilestoneCb) {
          this.onScoreMilestoneCb(Math.floor(this.score / 500) * 500);
        }
      }
    }

    // 1. Biomes & Atmosphere
    this.updateBiomes();

    // 2. Day/Night Cycle
    const cycle = (this.score % 1400) / 1400;
    if (cycle < 0.45) this.nightTransition = 0;
    else if (cycle < 0.55) this.nightTransition = (cycle - 0.45) / 0.1;
    else if (cycle < 0.9) this.nightTransition = 1;
    else this.nightTransition = 1 - (cycle - 0.9) / 0.1;

    // 3. Dino & Co-Op Physics
    this.updateDinoPhysics(dt);

    // 4. Baby Dinos Parade Physics
    this.updateBabyDinos(dt);

    // 5. Dino Freeze Challenge
    this.updateFreezeChallenge(dt, deltaDist);

    // 6. Active Power-Ups
    this.updatePowerUps(dt);

    // 7. Boss Encounter
    this.updateBoss(dt);

    // 8. Obstacles & Hearts Spawning
    this.updateObstacles(dt, deltaDist);

    // 9. Weather & Atmosphere
    this.updateAtmosphere(dt, deltaDist);

    // 10. Effects & Juice
    this.updateEffects(dt);

    // 11. Collisions
    this.checkCollisions();
  }

  private updateBiomes() {
    if (this.score < 600) this.currentBiome = 'desert';
    else if (this.score < 1400) this.currentBiome = 'volcano';
    else if (this.score < 2200) this.currentBiome = 'jungle';
    else this.currentBiome = 'cyber';
  }

  private updateDinoPhysics(dt: number) {
    const dino = this.dino;
    const currentHeight = dino.isDucking ? dino.duckHeight : dino.standHeight;

    if (!dino.isGrounded) {
      const effectiveGravity = (this.activePowerUps.has('wings') && dino.isGliding)
        ? this.gravity * 0.3
        : this.gravity;

      dino.vy += effectiveGravity * dt;
      dino.y += dino.vy * dt;
      this.coyoteTimer -= dt;

      if (dino.y + currentHeight >= this.groundY) {
        dino.y = this.groundY - currentHeight;
        dino.vy = 0;
        dino.isGrounded = true;
        dino.isJumping = false;
        dino.isGliding = false;

        dino.squashX = 1.25;
        dino.squashY = 0.8;

        if (this.jumpBufferTimer > 0) {
          this.performJump(false, 1.0);
        }
      }
    } else {
      dino.y = this.groundY - currentHeight;
      this.coyoteTimer = 0.1;
      if (this.jumpBufferTimer > 0) {
        this.performJump(false, 1.0);
      }
    }

    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= dt;
    }

    dino.squashX += (1 - dino.squashX) * Math.min(1, dt * 14);
    dino.squashY += (1 - dino.squashY) * Math.min(1, dt * 14);

    dino.runTimer += dt * (this.currentSpeed / 120);
    if (dino.runTimer > 1) {
      dino.runTimer = 0;
      dino.runFrame = (dino.runFrame + 1) % 2;
    }

    // Co-op Little Dino Physics
    if (this.mode === 'family_coop') {
      const little = this.littleDino;
      if (!little.isGrounded) {
        little.vy += this.gravity * dt;
        little.y += little.vy * dt;
        if (little.y + little.height >= this.groundY) {
          little.y = this.groundY - little.height;
          little.vy = 0;
          little.isGrounded = true;
          little.isJumping = false;
        }
      } else {
        little.y = this.groundY - little.height;
      }
    }
  }

  private updateBabyDinos(dt: number) {
    // Baby dinos follow along and hop synchronously with a staggered delay
    for (let i = 0; i < this.babyDinos.length; i++) {
      const baby = this.babyDinos[i];
      if (this.dino.isJumping) {
        baby.hopY = Math.sin((this.gameTime - baby.jumpDelay) * 10) * 25;
        if (baby.hopY < 0) baby.hopY = 0;
      } else {
        baby.hopY = Math.abs(Math.sin(this.gameTime * 12 + i)) * 6;
      }
    }
  }

  // --- Dino Freeze (Red Light / Green Light) ---
  private updateFreezeChallenge(dt: number, deltaDist: number) {
    if (!this.freezeChallenge) {
      this.nextFreezeDistance -= deltaDist;
      if (this.nextFreezeDistance <= 0) {
        // Trigger Freeze challenge!
        this.freezeChallenge = {
          active: true,
          timer: 3.0,
          maxTimer: 3.0,
          motionDetectedDuringFreeze: false,
          passed: false,
          failed: false,
        };
        sound.playBossWarning();
        cheerVoice.cheerFreeze();
      }
      return;
    }

    const fc = this.freezeChallenge;
    fc.timer -= dt;

    // Check camera stillness
    if (!this.isCameraFrozenStill && fc.timer > 0.4) {
      fc.motionDetectedDuringFreeze = true;
    }

    if (fc.timer <= 0) {
      if (!fc.motionDetectedDuringFreeze) {
        fc.passed = true;
        this.freezeChallengesPassed++;
        this.score += 200;
        sound.playScoreMilestone();
        cheerVoice.cheerFreezePassed();
      } else {
        fc.failed = true;
      }

      setTimeout(() => {
        this.freezeChallenge = null;
        this.nextFreezeDistance = 1400 + Math.random() * 1000;
      }, 1400);
    }
  }

  private updatePowerUps(dt: number) {
    this.activePowerUps.forEach((powerUp, type) => {
      powerUp.remainingTime -= dt;
      if (powerUp.remainingTime <= 0) {
        this.activePowerUps.delete(type);
        if (type === 'shield') {
          this.hasShield = false;
        }
      }
    });

    if (this.activePowerUps.has('magnet')) {
      for (const obs of this.obstacles) {
        if (obs.type === 'egg_collectible' || obs.type === 'heart_collectible') {
          const dx = (this.dino.x + 30) - obs.x;
          const dy = (this.dino.y + 30) - obs.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 440) {
            obs.x += (dx / dist) * 400 * dt;
            obs.y += (dy / dist) * 400 * dt;
          }
        }
      }
    }
  }

  private updateBoss(dt: number) {
    if (!this.boss && this.score >= this.nextBossScore) {
      this.spawnBoss();
      return;
    }
    if (!this.boss) return;

    const b = this.boss;
    b.timer += dt;

    if (b.state === 'telegraph') {
      if (b.timer >= 2.5) {
        b.state = 'attacking';
        b.timer = 0;
      }
    } else if (b.state === 'attacking') {
      if (b.type === 'titan_pterodactyl') {
        b.x -= this.currentSpeed * 1.5 * dt;
        b.y = this.groundY - 80 + Math.sin(b.timer * 4) * 35;
      } else {
        b.x -= this.currentSpeed * 1.35 * dt;
      }

      if (b.x < -160) {
        this.boss = null;
        this.score += 250;
        this.nextBossScore = this.score + 1400;
        sound.playScoreMilestone();
      }
    }
  }

  private spawnBoss() {
    sound.playBossWarning();
    const isPtero = Math.random() > 0.5;
    this.boss = {
      active: true,
      name: isPtero ? 'TITAN PTEROSAUR' : 'ALPHA SPINOSAURUS',
      type: isPtero ? 'titan_pterodactyl' : 'spinosaurus',
      x: this.width + 120,
      y: isPtero ? this.groundY - 110 : this.groundY - 90,
      width: 90,
      height: 75,
      state: 'telegraph',
      timer: 0,
      maxTimer: 2.5,
      hp: 1,
      maxHp: 1,
      animFrame: 0,
      warningTelegraph: isPtero ? '⚠️ INCOMING AIR SWOOP! DUCK OR JUMP!' : '⚠️ TITAN CHARGE! PREPARE TO JUMP!',
    };

    if (this.onBossEncounterCb) {
      this.onBossEncounterCb(this.boss.name);
    }
  }

  private updateObstacles(dt: number, deltaDist: number) {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= deltaDist;

      obs.animTimer += dt;
      if (obs.type.startsWith('pterodactyl')) {
        if (obs.animTimer > 0.15) {
          obs.animTimer = 0;
          obs.animFrame = (obs.animFrame + 1) % 2;
        }
      }

      if (obs.x + obs.width < -100) {
        this.obstacles.splice(i, 1);
      }
    }

    this.nextObstacleDistance -= deltaDist;
    if (this.nextObstacleDistance <= 0) {
      this.spawnObstacle();
      const minGap = 440 + Math.random() * 260;
      const speedFactor = this.currentSpeed / 400;
      this.nextObstacleDistance = minGap * (0.8 + speedFactor * 0.2);
    }

    this.nextEggDistance -= deltaDist;
    if (this.nextEggDistance <= 0) {
      this.spawnEgg();
      this.nextEggDistance = 1000 + Math.random() * 800;
    }

    // Spawn Heart in Kid Mode
    this.nextHeartDistance -= deltaDist;
    if (this.nextHeartDistance <= 0 && this.lives < this.maxLives) {
      this.spawnHeart();
      this.nextHeartDistance = 1600 + Math.random() * 1200;
    }

    this.nextPowerUpDistance -= deltaDist;
    if (this.nextPowerUpDistance <= 0) {
      this.spawnPowerUp();
      this.nextPowerUpDistance = 1600 + Math.random() * 1400;
    }
  }

  private spawnObstacle() {
    const id = ++this.obstacleIdCounter;
    const canSpawnPterodactyl = this.score > 220;
    const rand = Math.random();

    let type: ObstacleType;
    let width = 36;
    let height = 48;
    let y = this.groundY - height;

    if (canSpawnPterodactyl && rand > 0.68) {
      const pRand = Math.random();
      width = 50;
      height = 36;
      if (pRand < 0.45) {
        type = 'pterodactyl_mid';
        y = this.groundY - 58;
      } else if (pRand < 0.8) {
        type = 'pterodactyl_low';
        y = this.groundY - 38;
      } else {
        type = 'pterodactyl_high';
        y = this.groundY - 88;
      }
    } else {
      const cRand = Math.random();
      if (cRand < 0.4) {
        type = 'cactus_small';
        width = 28;
        height = 46;
        y = this.groundY - height;
      } else if (cRand < 0.75) {
        type = 'cactus_double';
        width = 46;
        height = 54;
        y = this.groundY - height;
      } else {
        type = 'cactus_large';
        width = 52;
        height = 68;
        y = this.groundY - height;
      }
    }

    this.obstacles.push({
      id,
      type,
      x: this.width + 60,
      y,
      width,
      height,
      hitboxes: this.computeObstacleHitboxes(type, this.width + 60, y, width, height),
      animFrame: 0,
      animTimer: 0,
    });
  }

  private spawnEgg() {
    const id = ++this.obstacleIdCounter;
    const y = this.groundY - 70 - Math.random() * 45;
    this.obstacles.push({
      id,
      type: 'egg_collectible',
      x: this.width + 80,
      y,
      width: 28,
      height: 30,
      hitboxes: [{ x: this.width + 80, y, width: 28, height: 30 }],
      animFrame: 0,
      animTimer: Math.random() * 10,
    });
  }

  private spawnHeart() {
    const id = ++this.obstacleIdCounter;
    const y = this.groundY - 65;
    this.obstacles.push({
      id,
      type: 'heart_collectible',
      x: this.width + 80,
      y,
      width: 28,
      height: 28,
      hitboxes: [{ x: this.width + 80, y, width: 28, height: 28 }],
      animFrame: 0,
      animTimer: 0,
    });
  }

  private spawnPowerUp() {
    const types: PowerUpType[] = ['shield', 'wings', 'magnet', 'multiplier'];
    const chosen = types[Math.floor(Math.random() * types.length)];
    const id = ++this.obstacleIdCounter;
    const y = this.groundY - 65 - Math.random() * 40;

    this.obstacles.push({
      id,
      type: `powerup_${chosen}` as ObstacleType,
      x: this.width + 80,
      y,
      width: 32,
      height: 32,
      hitboxes: [{ x: this.width + 80, y, width: 32, height: 32 }],
      animFrame: 0,
      animTimer: 0,
    });
  }

  private computeObstacleHitboxes(
    type: ObstacleType,
    x: number,
    y: number,
    w: number,
    h: number
  ): BoundingBox[] {
    const inset = 4;
    switch (type) {
      case 'cactus_small':
        return [{ x: x + inset, y: y + 2, width: w - inset * 2, height: h - 2 }];
      case 'cactus_double':
        return [
          { x: x + 4, y: y + 10, width: 14, height: h - 10 },
          { x: x + 20, y: y + 2, width: 22, height: h - 2 },
        ];
      case 'cactus_large':
        return [
          { x: x + 12, y: y + 2, width: 24, height: h - 2 },
          { x: x + 2, y: y + 14, width: w - 4, height: 32 },
        ];
      case 'pterodactyl_low':
      case 'pterodactyl_mid':
      case 'pterodactyl_high':
        return [
          { x: x + 8, y: y + 8, width: 34, height: 20 },
          { x: x + 16, y: y + 2, width: 20, height: 28 },
        ];
      default:
        return [{ x: x + 2, y: y + 2, width: w - 4, height: h - 4 }];
    }
  }

  private updateAtmosphere(dt: number, deltaDist: number) {
    for (const c of this.clouds) {
      c.x -= deltaDist * 0.18 + c.speed * dt;
      if (c.x < -180) {
        c.x = this.width + 60;
        c.y = 40 + Math.random() * (this.groundY - 140);
      }
    }

    if (this.currentBiome === 'jungle') {
      if (this.weatherParticles.length < 50) {
        this.weatherParticles.push({
          x: Math.random() * this.width,
          y: -20,
          vx: -120,
          vy: 550,
          length: 12,
          color: '#38bdf8',
          alpha: 0.6,
        });
      }
      if (Math.random() < 0.003) {
        this.lightningFlash = 0.8;
      }
    } else if (this.currentBiome === 'volcano') {
      if (this.weatherParticles.length < 35) {
        this.weatherParticles.push({
          x: Math.random() * this.width,
          y: this.groundY - Math.random() * 30,
          vx: -this.currentSpeed * 0.4 + (Math.random() - 0.5) * 80,
          vy: -80 - Math.random() * 120,
          length: 4,
          color: Math.random() > 0.5 ? '#f97316' : '#facc15',
          alpha: 0.8,
        });
      }
    }

    if (this.lightningFlash > 0) {
      this.lightningFlash = Math.max(0, this.lightningFlash - dt * 4);
    }

    for (let i = this.weatherParticles.length - 1; i >= 0; i--) {
      const wp = this.weatherParticles[i];
      wp.x += wp.vx * dt;
      wp.y += wp.vy * dt;
      if (wp.y > this.groundY || wp.x < -50) {
        this.weatherParticles.splice(i, 1);
      }
    }
  }

  private updateEffects(dt: number) {
    if (this.shakeMagnitude > 0) {
      this.shakeMagnitude = Math.max(0, this.shakeMagnitude - dt * 38);
      this.screenShake = {
        x: (Math.random() - 0.5) * this.shakeMagnitude * 2,
        y: (Math.random() - 0.5) * this.shakeMagnitude * 2,
      };
    } else {
      this.screenShake = { x: 0, y: 0 };
    }

    if (this.hitFlash > 0) {
      this.hitFlash = Math.max(0, this.hitFlash - dt * 4);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.gravity) {
        p.vy += p.gravity * dt;
      }
      p.alpha = 1 - p.life / p.maxLife;
    }

    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += dt * 750;
      sw.alpha = 1 - sw.radius / sw.maxRadius;
      if (sw.radius >= sw.maxRadius) {
        this.shockwaves.splice(i, 1);
      }
    }
  }

  private checkCollisions() {
    const dino = this.dino;

    const dinoBoxes: BoundingBox[] = dino.isDucking
      ? [
          { x: dino.x + 8, y: dino.y + 8, width: 56, height: 22 },
          { x: dino.x + 46, y: dino.y + 4, width: 24, height: 16 },
        ]
      : [
          { x: dino.x + 12, y: dino.y + 18, width: 32, height: 42 },
          { x: dino.x + 24, y: dino.y + 4, width: 30, height: 22 },
        ];

    // Check Boss
    if (this.boss && this.boss.state === 'attacking') {
      const bBox: BoundingBox = {
        x: this.boss.x + 10,
        y: this.boss.y + 10,
        width: this.boss.width - 20,
        height: this.boss.height - 20,
      };
      for (const dBox of dinoBoxes) {
        if (
          dBox.x < bBox.x + bBox.width &&
          dBox.x + dBox.width > bBox.x &&
          dBox.y < bBox.y + bBox.height &&
          dBox.y + dBox.height > bBox.y
        ) {
          if (this.hasShield) {
            this.breakShield();
            this.boss = null;
            return;
          }
          this.handleDamageOrFatalCollision();
          return;
        }
      }
    }

    // Check Obstacles & Collectibles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      const hitboxes = this.computeObstacleHitboxes(obs.type, obs.x, obs.y, obs.width, obs.height);

      let collided = false;
      for (const dBox of dinoBoxes) {
        for (const oBox of hitboxes) {
          if (
            dBox.x < oBox.x + oBox.width &&
            dBox.x + dBox.width > oBox.x &&
            dBox.y < oBox.y + oBox.height &&
            dBox.y + dBox.height > oBox.y
          ) {
            collided = true;
            break;
          }
        }
        if (collided) break;
      }

      if (collided) {
        if (obs.type === 'egg_collectible') {
          this.obstacles.splice(i, 1);
          this.eggsCollected++;
          sound.playCollectEgg();
          if (this.onEggCollectedCb) this.onEggCollectedCb();
          this.spawnCollectSparks(obs.x + 14, obs.y + 14, '#fde047');
        } else if (obs.type === 'heart_collectible') {
          // Restore heart!
          this.obstacles.splice(i, 1);
          this.lives = Math.min(this.maxLives, this.lives + 1);
          sound.playCollectEgg();
          cheerVoice.cheerHeartFound();
          this.spawnCollectSparks(obs.x + 14, obs.y + 14, '#ef4444');
        } else if (obs.type.startsWith('powerup_')) {
          const powerType = obs.type.replace('powerup_', '') as PowerUpType;
          this.obstacles.splice(i, 1);
          this.activatePowerUp(powerType);
          this.spawnCollectSparks(obs.x + 16, obs.y + 16, '#38bdf8');
        } else {
          // Hazard hit!
          if (this.hasShield) {
            this.breakShield();
            this.obstacles.splice(i, 1);
            return;
          }

          // If invincible right now, pass through safely
          if (this.invincibleTimer > 0) {
            return;
          }

          // Take damage or fatal collision
          this.obstacles.splice(i, 1);
          this.handleDamageOrFatalCollision();
          return;
        }
      }
    }
  }

  private handleDamageOrFatalCollision() {
    this.lives--;
    sound.playCollision();
    this.shakeMagnitude = 14;
    this.hitFlash = 0.8;

    if (this.lives > 0) {
      // Kid / Co-op mode: stumble, lose 1 heart, grant 2.0s invincibility!
      this.invincibleTimer = 2.0;
      cheerVoice.cheerHeartLost();
      // Little cartoon trip squash
      this.dino.squashX = 1.35;
      this.dino.squashY = 0.7;
    } else {
      // Fatal game over
      this.handleFatalGameOver();
    }
  }

  private activatePowerUp(type: PowerUpType) {
    sound.playPowerUp();
    const duration = type === 'wings' ? 6.0 : (type === 'shield' ? 14.0 : 8.0);
    this.activePowerUps.set(type, {
      type,
      remainingTime: duration,
      totalTime: duration,
    });

    if (type === 'shield') {
      this.hasShield = true;
    }

    if (this.onPowerUpCollectedCb) {
      this.onPowerUpCollectedCb(type);
    }
  }

  private breakShield() {
    this.hasShield = false;
    this.activePowerUps.delete('shield');
    sound.playShieldBreak();
    this.shakeMagnitude = 10;
    this.hitFlash = 0.5;

    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 160;
      this.particles.push({
        x: this.dino.x + 30,
        y: this.dino.y + 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3,
        color: '#38bdf8',
        alpha: 1,
        life: 0,
        maxLife: 0.4,
        gravity: 100,
      });
    }
  }

  private spawnCollectSparks(x: number, y: number, color: string) {
    for (let p = 0; p < 14; p++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color,
        alpha: 1,
        life: 0,
        maxLife: 0.45,
        gravity: 40,
      });
    }
  }

  private handleFatalGameOver() {
    this.dino.isDead = true;
    this.state = 'gameover';
    this.hitstopTimer = 0.05;
    this.shakeMagnitude = 18;
    this.hitFlash = 1;

    sound.stopMusic();
    sound.playCollision();

    for (let i = 0; i < 22; i++) {
      const angle = (Math.PI / 180) * (200 + Math.random() * 140);
      const speed = 120 + Math.random() * 260;
      this.particles.push({
        x: this.dino.x + 28,
        y: this.dino.y + 24,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        color: i % 2 === 0 ? this.dino.skin.primaryColor : '#ef4444',
        alpha: 1,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.3,
        gravity: 600,
      });
    }

    this.completeWorkout(false);
  }

  private completeWorkout(targetCompleted: boolean) {
    const duration = Math.max(1, this.gameTime);
    const cadenceJpm = Math.round((this.physicalJumps / duration) * 60);
    const peakPct = Math.min(100, Math.round(this.peakJumpIntensity * 60));

    let fitnessTier: 'Rookie' | 'Athletic' | 'Apex Predator' | 'Dino Champion' = 'Rookie';
    if (this.physicalJumps >= 35 || cadenceJpm >= 30) {
      fitnessTier = 'Dino Champion';
    } else if (this.physicalJumps >= 20 || cadenceJpm >= 20) {
      fitnessTier = 'Apex Predator';
    } else if (this.physicalJumps >= 8) {
      fitnessTier = 'Athletic';
    }

    // Award badge for child & family
    let awardBadge = {
      title: 'Thunder-Stomper Badge',
      description: 'Energetic feet that shake the earth!',
      icon: '🦖',
    };
    if (this.peakJumpIntensity > 1.3) {
      awardBadge = {
        title: 'The High-Flyer Award',
        description: 'Spectacular leaps reaching for the stars!',
        icon: '🪽',
      };
    } else if (this.babyDinos.length >= 3) {
      awardBadge = {
        title: 'Dino Family Rescuer',
        description: 'Saved and hatched a whole squad of baby dinosaurs!',
        icon: '🥚',
      };
    } else if (this.physicalJumps >= 25) {
      awardBadge = {
        title: 'Super Energy Champion',
        description: 'Endless bounce and stamina!',
        icon: '⚡',
      };
    }

    const report: WorkoutReport = {
      mode: this.mode,
      totalPhysicalJumps: this.physicalJumps,
      durationSeconds: Math.floor(duration),
      cadenceJpm,
      peakIntensityPct: peakPct,
      caloriesBurned: parseFloat(this.caloriesBurned.toFixed(1)),
      distanceMeters: Math.floor(this.distanceMeters),
      score: this.score,
      babyDinosHatched: this.babyDinosHatchedTotal,
      freezeChallengesPassed: this.freezeChallengesPassed,
      fitnessTier,
      awardBadge,
      targetCompleted,
    };

    this.onGameOverCb(report);
  }
}

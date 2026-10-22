/**
 * Comprehensive Types for Dino Jump Vision - Family & Kid Edition
 */

export type GameState = 'title' | 'playing' | 'paused' | 'gameover' | 'warmup';

export type GameMode = 'endless' | 'kid_adventure' | 'family_coop' | 'sprint50' | 'hiit3min';

export type GameSpeed = 'gentle' | 'normal' | 'fast' | 'turbo';

export interface SpeedConfig {
  id: GameSpeed;
  label: string;
  icon: string;
  baseSpeed: number;
  maxSpeed: number;
  minGap: number;
  description: string;
}

export const SPEED_PRESETS: Record<GameSpeed, SpeedConfig> = {
  gentle: {
    id: 'gentle',
    label: 'Gentle (Kids)',
    icon: '🐢',
    baseSpeed: 230,
    maxSpeed: 270,
    minGap: 560,
    description: 'Slow, relaxed pace with big gaps between obstacles. Ideal for young kids!',
  },
  normal: {
    id: 'normal',
    label: 'Normal (Family)',
    icon: '🚶',
    baseSpeed: 310,
    maxSpeed: 390,
    minGap: 460,
    description: 'Balanced pace for fun parent & kid active jumping.',
  },
  fast: {
    id: 'fast',
    label: 'Fast',
    icon: '🏃',
    baseSpeed: 380,
    maxSpeed: 540,
    minGap: 420,
    description: 'High energy sprint for older kids & adults.',
  },
  turbo: {
    id: 'turbo',
    label: 'Turbo Arcade',
    icon: '⚡',
    baseSpeed: 460,
    maxSpeed: 750,
    minGap: 380,
    description: 'Maximum speed challenge!',
  },
};

export type DinoSkin = 'classic' | 'cyber' | 'volcano' | 'golden';

export type AccessoryType = 
  | 'none' 
  | 'propeller_hat' 
  | 'superhero_cape' 
  | 'party_hat' 
  | 'sunglasses' 
  | 'crown' 
  | 'goggles' 
  | 'headband';

export interface AccessoryConfig {
  id: AccessoryType;
  name: string;
  cost: number;
  description: string;
  icon: string;
}

export type BiomeType = 'desert' | 'volcano' | 'jungle' | 'cyber';

export type PowerUpType = 'shield' | 'wings' | 'magnet' | 'multiplier' | 'golden_heart';

export interface ActivePowerUp {
  type: PowerUpType;
  remainingTime: number;
  totalTime: number;
}

export interface DinoSkinConfig {
  id: DinoSkin;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  eyeColor: string;
  particleColor: string;
  description: string;
}

export type ObstacleType = 
  | 'cactus_small' 
  | 'cactus_double' 
  | 'cactus_large' 
  | 'pterodactyl_low' 
  | 'pterodactyl_mid' 
  | 'pterodactyl_high'
  | 'egg_collectible'
  | 'heart_collectible'
  | 'powerup_shield'
  | 'powerup_wings'
  | 'powerup_magnet'
  | 'powerup_multiplier';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Obstacle {
  id: number;
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
  hitboxes: BoundingBox[];
  animFrame: number;
  animTimer: number;
  collected?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  gravity?: number;
  rotation?: number;
  vRot?: number;
}

export interface WeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  color: string;
  alpha: number;
}

export interface Cloud {
  x: number;
  y: number;
  speed: number;
  scale: number;
  opacity: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  twinkleSpeed: number;
  baseAlpha: number;
}

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

export interface Boss {
  active: boolean;
  name: string;
  type: 'spinosaurus' | 'titan_pterodactyl';
  x: number;
  y: number;
  width: number;
  height: number;
  state: 'telegraph' | 'attacking' | 'retreating';
  timer: number;
  maxTimer: number;
  hp: number;
  maxHp: number;
  animFrame: number;
  warningTelegraph: string;
}

export type BabyDinoType = 'baby_trex' | 'baby_tricera' | 'baby_stego' | 'baby_bronto';

export interface BabyDino {
  id: number;
  type: BabyDinoType;
  name: string;
  color: string;
  xOffset: number; // distance behind player
  jumpDelay: number;
  hopY: number;
}

export interface FreezeChallenge {
  active: boolean;
  timer: number;
  maxTimer: number;
  motionDetectedDuringFreeze: boolean;
  passed: boolean;
  failed: boolean;
}

export interface PoseLandmarks {
  head: { x: number; y: number };
  neck: { x: number; y: number };
  leftShoulder: { x: number; y: number };
  rightShoulder: { x: number; y: number };
  torso: { x: number; y: number };
  leftArmRaised: boolean;
  rightArmRaised: boolean;
  isRoarGesture: boolean;
  isStompGesture: boolean;
  isFrozenStill: boolean;
}

export interface MotionDetectionStats {
  cameraActive: boolean;
  cameraPermissionGranted: boolean;
  cameraError: string | null;
  baselineY: number;
  currentHeadY: number;
  jumpVelocity: number;
  jumpThreshold: number;
  duckThreshold: number;
  isJumping: boolean;
  isDucking: boolean;
  lastJumpTime: number;
  totalPhysicalJumps: number;
  sensitivity: 'low' | 'normal' | 'high' | 'extreme';
  motionIntensity: number;
  jumpIntensity: number;
  isFrozenStill: boolean;
  landmarks?: PoseLandmarks;
}

export interface WorkoutReport {
  mode: GameMode;
  totalPhysicalJumps: number;
  durationSeconds: number;
  cadenceJpm: number;
  peakIntensityPct: number;
  caloriesBurned: number;
  distanceMeters: number;
  score: number;
  babyDinosHatched: number;
  freezeChallengesPassed: number;
  fitnessTier: 'Rookie' | 'Athletic' | 'Apex Predator' | 'Dino Champion';
  awardBadge: {
    title: string;
    description: string;
    icon: string;
  };
  targetCompleted: boolean;
}

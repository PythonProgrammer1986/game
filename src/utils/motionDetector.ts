/**
 * Enhanced Computer Vision Motion, Pose Landmark, Stomp & Freeze Detector
 * Supports kid-friendly movement prompts: Jumping, Stomping, Freezing, and Roaring!
 */

import { PoseLandmarks } from '../game/types';

export interface MotionDetectorConfig {
  sensitivity: 'low' | 'normal' | 'high' | 'extreme';
  onJump: (intensity: number) => void;
  onDuckChange?: (isDucking: boolean) => void;
  onRoarGesture?: () => void;
  onStompGesture?: () => void;
}

export class MotionDetector {
  private video: HTMLVideoElement | null = null;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D | null;
  private prevFrameData: Uint8ClampedArray | null = null;
  private width: number = 200;
  private height: number = 150;

  private sensitivity: 'low' | 'normal' | 'high' | 'extreme' = 'normal';
  private onJumpCallback: (intensity: number) => void;
  private onDuckChangeCallback?: (isDucking: boolean) => void;
  private onRoarGestureCallback?: () => void;
  private onStompGestureCallback?: () => void;

  // Tracking state
  private baselineY: number = 0.45;
  private currentHeadY: number = 0.45;
  private smoothedHeadY: number = 0.45;
  private prevHeadY: number = 0.45;
  private jumpVelocity: number = 0;
  private isCurrentlyDucking: boolean = false;
  private lastJumpTimestamp: number = 0;
  private lastRoarTimestamp: number = 0;
  private lastStompTimestamp: number = 0;
  private stationaryFrames: number = 0;
  private motionIntensity: number = 0;
  private isCalibrated: boolean = false;
  private calibrationFrames: number[] = [];

  // Skeleton landmarks
  private landmarks: PoseLandmarks = {
    head: { x: 0.5, y: 0.4 },
    neck: { x: 0.5, y: 0.5 },
    leftShoulder: { x: 0.4, y: 0.52 },
    rightShoulder: { x: 0.6, y: 0.52 },
    torso: { x: 0.5, y: 0.68 },
    leftArmRaised: false,
    rightArmRaised: false,
    isRoarGesture: false,
    isStompGesture: false,
    isFrozenStill: true,
  };

  private jumpCooldownMs: number = 320;
  private roarCooldownMs: number = 3000;
  private stompCooldownMs: number = 1400;

  constructor(config: MotionDetectorConfig) {
    this.sensitivity = config.sensitivity;
    this.onJumpCallback = config.onJump;
    this.onDuckChangeCallback = config.onDuckChange;
    this.onRoarGestureCallback = config.onRoarGesture;
    this.onStompGestureCallback = config.onStompGesture;

    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = this.width;
    this.offscreenCanvas.height = this.height;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
  }

  public setVideo(video: HTMLVideoElement | null) {
    this.video = video;
    this.resetCalibration();
  }

  public setSensitivity(level: 'low' | 'normal' | 'high' | 'extreme') {
    this.sensitivity = level;
  }

  public resetCalibration() {
    this.isCalibrated = false;
    this.calibrationFrames = [];
    this.stationaryFrames = 0;
    this.prevFrameData = null;
    this.baselineY = 0.45;
    this.currentHeadY = 0.45;
    this.smoothedHeadY = 0.45;
  }

  private getThresholds() {
    switch (this.sensitivity) {
      case 'low':
        return { jumpDist: 0.13, jumpVel: 0.08, duckDist: 0.15 };
      case 'high':
        return { jumpDist: 0.06, jumpVel: 0.038, duckDist: 0.10 };
      case 'extreme':
        return { jumpDist: 0.035, jumpVel: 0.022, duckDist: 0.07 };
      case 'normal':
      default:
        return { jumpDist: 0.09, jumpVel: 0.055, duckDist: 0.12 };
    }
  }

  public processFrame(now: number): {
    jumpDetected: boolean;
    isDucking: boolean;
    headY: number;
    baselineY: number;
    motionIntensity: number;
    jumpVelocity: number;
    jumpIntensity: number;
    isFrozenStill: boolean;
    landmarks: PoseLandmarks;
  } {
    if (!this.video || !this.offscreenCtx || this.video.readyState < 2) {
      return {
        jumpDetected: false,
        isDucking: false,
        headY: this.baselineY,
        baselineY: this.baselineY,
        motionIntensity: 0,
        jumpVelocity: 0,
        jumpIntensity: 1.0,
        isFrozenStill: true,
        landmarks: this.landmarks,
      };
    }

    const ctx = this.offscreenCtx;
    ctx.drawImage(this.video, 0, 0, this.width, this.height);

    let frame: ImageData;
    try {
      frame = ctx.getImageData(0, 0, this.width, this.height);
    } catch {
      return {
        jumpDetected: false,
        isDucking: false,
        headY: this.baselineY,
        baselineY: this.baselineY,
        motionIntensity: 0,
        jumpVelocity: 0,
        jumpIntensity: 1.0,
        isFrozenStill: true,
        landmarks: this.landmarks,
      };
    }

    const data = frame.data;
    const len = data.length;

    if (!this.prevFrameData || this.prevFrameData.length !== len) {
      this.prevFrameData = new Uint8ClampedArray(len);
      this.prevFrameData.set(data);
      return {
        jumpDetected: false,
        isDucking: false,
        headY: this.baselineY,
        baselineY: this.baselineY,
        motionIntensity: 0,
        jumpVelocity: 0,
        jumpIntensity: 1.0,
        isFrozenStill: true,
        landmarks: this.landmarks,
      };
    }

    let totalMotionPixels = 0;
    let motionXSum = 0;
    let motionYSum = 0;
    let leftArmMotionCount = 0;
    let rightArmMotionCount = 0;

    const rowMotionCounts = new Uint16Array(this.height);
    const step = 2;

    for (let y = 0; y < this.height; y += step) {
      let rowMotion = 0;
      const rowOffset = y * this.width * 4;
      for (let x = 0; x < this.width; x += step) {
        const idx = rowOffset + x * 4;
        const diffR = Math.abs(data[idx] - this.prevFrameData[idx]);
        const diffG = Math.abs(data[idx + 1] - this.prevFrameData[idx + 1]);
        const diffB = Math.abs(data[idx + 2] - this.prevFrameData[idx + 2]);
        const diff = (diffR + diffG + diffB) / 3;

        if (diff > 22) {
          rowMotion++;
          totalMotionPixels++;
          motionXSum += x;
          motionYSum += y;

          if (y < this.baselineY * this.height * 0.85) {
            if (x < this.width * 0.35) {
              leftArmMotionCount++;
            } else if (x > this.width * 0.65) {
              rightArmMotionCount++;
            }
          }
        }
      }
      rowMotionCounts[y] = rowMotion;
    }

    for (let i = 0; i < len; i += 4) {
      this.prevFrameData[i] = data[i];
      this.prevFrameData[i + 1] = data[i + 1];
      this.prevFrameData[i + 2] = data[i + 2];
    }

    const totalSamples = (this.width / step) * (this.height / step);
    const motionRatio = totalMotionPixels / totalSamples;
    this.motionIntensity = Math.min(1, motionRatio * 6);

    // Freeze Stillness Check: less than 4% motion
    const isFrozenStill = this.motionIntensity < 0.045;

    let detectedHeadYIndex = -1;
    const rowThreshold = Math.max(4, Math.floor((this.width / step) * 0.05));
    for (let y = 0; y < this.height; y += step) {
      if (rowMotionCounts[y] >= rowThreshold) {
        detectedHeadYIndex = y;
        break;
      }
    }

    let normalizedHead = this.baselineY;
    let centerX = 0.5;
    if (totalMotionPixels > 10) {
      centerX = (motionXSum / totalMotionPixels) / this.width;
    }

    if (detectedHeadYIndex >= 0) {
      normalizedHead = detectedHeadYIndex / this.height;
    } else if (totalMotionPixels > 10) {
      normalizedHead = (motionYSum / totalMotionPixels) / this.height * 0.7;
    }

    this.smoothedHeadY += (normalizedHead - this.smoothedHeadY) * 0.35;
    this.currentHeadY = this.smoothedHeadY;

    if (!this.isCalibrated) {
      if (this.calibrationFrames.length < 30) {
        if (detectedHeadYIndex >= 0) {
          this.calibrationFrames.push(this.smoothedHeadY);
        }
      } else {
        const avg = this.calibrationFrames.reduce((a, b) => a + b, 0) / this.calibrationFrames.length;
        this.baselineY = Math.max(0.2, Math.min(0.75, avg));
        this.isCalibrated = true;
      }
    } else {
      if (this.motionIntensity < 0.12) {
        this.stationaryFrames++;
        if (this.stationaryFrames > 45 && detectedHeadYIndex >= 0) {
          this.baselineY += (this.smoothedHeadY - this.baselineY) * 0.02;
        }
      } else {
        this.stationaryFrames = 0;
      }
    }

    const dtSeconds = 0.016;
    const rawVelocity = (this.currentHeadY - this.prevHeadY) / dtSeconds;
    this.jumpVelocity = this.jumpVelocity * 0.6 + rawVelocity * 0.4;
    this.prevHeadY = this.currentHeadY;

    const { jumpDist, jumpVel, duckDist } = this.getThresholds();
    const upwardDisplacement = this.baselineY - this.currentHeadY;
    const isMovingUpFast = this.jumpVelocity < -jumpVel;
    const isAboveJumpLine = upwardDisplacement > jumpDist;
    const hasCooldownElapsed = (now - this.lastJumpTimestamp) > this.jumpCooldownMs;

    let jumpDetected = false;
    let jumpIntensity = 1.0;

    if (hasCooldownElapsed && ((isAboveJumpLine && isMovingUpFast) || upwardDisplacement > jumpDist * 1.3)) {
      jumpDetected = true;
      this.lastJumpTimestamp = now;
      jumpIntensity = Math.min(1.7, Math.max(0.8, upwardDisplacement / jumpDist));
      this.onJumpCallback(jumpIntensity);
    }

    // Foot Stomp Detection: fast downward spike
    let isStompGesture = false;
    if (this.jumpVelocity > 0.09 && (now - this.lastStompTimestamp > this.stompCooldownMs)) {
      this.lastStompTimestamp = now;
      isStompGesture = true;
      if (this.onStompGestureCallback) {
        this.onStompGestureCallback();
      }
    }

    // Duck Detection
    const isDucking = (this.currentHeadY - this.baselineY) > duckDist;
    if (isDucking !== this.isCurrentlyDucking) {
      this.isCurrentlyDucking = isDucking;
      if (this.onDuckChangeCallback) {
        this.onDuckChangeCallback(isDucking);
      }
    }

    // Arms-Raised / Roar Gesture
    const leftArmRaised = leftArmMotionCount > 18;
    const rightArmRaised = rightArmMotionCount > 18;
    const isRoarGesture = (leftArmRaised && rightArmRaised) || (leftArmMotionCount + rightArmMotionCount > 36);

    if (isRoarGesture && (now - this.lastRoarTimestamp > this.roarCooldownMs)) {
      this.lastRoarTimestamp = now;
      if (this.onRoarGestureCallback) {
        this.onRoarGestureCallback();
      }
    }

    const hY = this.currentHeadY;
    this.landmarks = {
      head: { x: centerX, y: hY },
      neck: { x: centerX, y: Math.min(1, hY + 0.08) },
      leftShoulder: { x: Math.max(0.1, centerX - 0.12), y: Math.min(1, hY + 0.12) },
      rightShoulder: { x: Math.min(0.9, centerX + 0.12), y: Math.min(1, hY + 0.12) },
      torso: { x: centerX, y: Math.min(1, hY + 0.28) },
      leftArmRaised,
      rightArmRaised,
      isRoarGesture,
      isStompGesture,
      isFrozenStill,
    };

    return {
      jumpDetected,
      isDucking,
      headY: this.currentHeadY,
      baselineY: this.baselineY,
      motionIntensity: this.motionIntensity,
      jumpVelocity: this.jumpVelocity,
      jumpIntensity,
      isFrozenStill,
      landmarks: this.landmarks,
    };
  }

  public renderOverlay(
    canvas: HTMLCanvasElement, 
    stats: {
      headY: number;
      baselineY: number;
      isJumping: boolean;
      isDucking: boolean;
      motionIntensity: number;
      isFrozenStill?: boolean;
      landmarks?: PoseLandmarks;
    }
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const { jumpDist, duckDist } = this.getThresholds();
    const baseY = stats.baselineY * h;
    const jumpY = (stats.baselineY - jumpDist) * h;
    const duckY = (stats.baselineY + duckDist) * h;

    ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
    ctx.fillRect(0, 0, w, Math.max(0, jumpY));

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, jumpY);
    ctx.lineTo(w, jumpY);
    ctx.stroke();

    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    ctx.lineTo(w, baseY);
    ctx.stroke();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, duckY);
    ctx.lineTo(w, duckY);
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.font = '10px monospace';
    ctx.fillText('▲ JUMP ZONE', 8, Math.max(14, jumpY - 4));

    ctx.fillStyle = '#06b6d4';
    ctx.fillText('— BASELINE', 8, baseY - 4);

    ctx.fillStyle = '#f59e0b';
    ctx.fillText('▼ DUCK ZONE', 8, duckY + 12);

    const lm = stats.landmarks || this.landmarks;
    if (lm) {
      const hX = lm.head.x * w;
      const hY = lm.head.y * h;
      const nX = lm.neck.x * w;
      const nY = lm.neck.y * h;
      const lsX = lm.leftShoulder.x * w;
      const lsY = lm.leftShoulder.y * h;
      const rsX = lm.rightShoulder.x * w;
      const rsY = lm.rightShoulder.y * h;
      const tX = lm.torso.x * w;
      const tY = lm.torso.y * h;

      ctx.strokeStyle = stats.isJumping ? '#10b981' : (stats.isDucking ? '#f59e0b' : '#38bdf8');
      ctx.lineWidth = 2;
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.moveTo(hX, hY);
      ctx.lineTo(nX, nY);
      ctx.lineTo(tX, tY);
      ctx.moveTo(lsX, lsY);
      ctx.lineTo(rsX, rsY);
      ctx.stroke();

      if (lm.leftArmRaised) {
        ctx.strokeStyle = '#f43f5e';
        ctx.beginPath();
        ctx.moveTo(lsX, lsY);
        ctx.lineTo(lsX - 18, lsY - 24);
        ctx.stroke();
      }
      if (lm.rightArmRaised) {
        ctx.strokeStyle = '#f43f5e';
        ctx.beginPath();
        ctx.moveTo(rsX, rsY);
        ctx.lineTo(rsX + 18, rsY - 24);
        ctx.stroke();
      }

      ctx.fillStyle = stats.isJumping ? '#10b981' : '#38bdf8';
      [
        [hX, hY],
        [nX, nY],
        [lsX, lsY],
        [rsX, rsY],
        [tX, tY],
      ].forEach(([jx, jy]) => {
        ctx.beginPath();
        ctx.arc(jx, jy, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Stillness indicator
      if (stats.isFrozenStill) {
        ctx.fillStyle = '#06b6d4';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('❄️ FROZEN STILL', w / 2 - 40, h - 14);
      }
    }

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, h - 6, w, 6);
    ctx.fillStyle = stats.motionIntensity > 0.4 ? '#10b981' : '#64748b';
    ctx.fillRect(0, h - 6, w * stats.motionIntensity, 6);
  }
}

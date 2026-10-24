/**
 * Refined Computer Vision Half-Skeleton Motion, Pose Landmark, Stomp & Freeze Detector
 * Uses upper-body half-skeleton tracking (Head, Neck, Shoulders, Torso Centroid)
 * to eliminate false triggers from small movements and ensure authentic physical jumps.
 */

import { PoseLandmarks } from '../game/types';

export interface MotionDetectorConfig {
  sensitivity: 'low' | 'normal' | 'high' | 'extreme';
  onJump: (intensity: number) => void;
  onDuckChange?: (isDucking: boolean) => void;
  onRoarGesture?: () => void;
  onStompGesture?: () => void;
}

export type JumpState = 'grounded' | 'takeoff' | 'airborne' | 'landing';

export class MotionDetector {
  private video: HTMLVideoElement | null = null;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D | null;
  private prevFrameData: Uint8ClampedArray | null = null;
  private backgroundGray: Float32Array | null = null;
  private width: number = 200;
  private height: number = 150;

  private sensitivity: 'low' | 'normal' | 'high' | 'extreme' = 'normal';
  private onJumpCallback: (intensity: number) => void;
  private onDuckChangeCallback?: (isDucking: boolean) => void;
  private onRoarGestureCallback?: () => void;
  private onStompGestureCallback?: () => void;

  // Upper Body / Half-Skeleton Tracking State
  private baselineHeadY: number = 0.38;
  private baselineTorsoY: number = 0.65;
  private currentHeadY: number = 0.38;
  private currentTorsoY: number = 0.65;
  private smoothedHeadY: number = 0.38;
  private smoothedTorsoY: number = 0.65;
  private centerX: number = 0.5;
  private smoothedCenterX: number = 0.5;

  private prevHeadY: number = 0.38;
  private prevTorsoY: number = 0.65;
  private headVelocity: number = 0;
  private torsoVelocity: number = 0;
  private jumpVelocity: number = 0;

  private jumpState: JumpState = 'grounded';
  private isCurrentlyDucking: boolean = false;
  private lastJumpTimestamp: number = 0;
  private lastRoarTimestamp: number = 0;
  private lastStompTimestamp: number = 0;
  private stationaryFrames: number = 0;
  private motionIntensity: number = 0;
  private isCalibrated: boolean = false;
  private calibrationSamples: { headY: number; torsoY: number }[] = [];

  // Half-Skeleton Landmarks
  private landmarks: PoseLandmarks = {
    head: { x: 0.5, y: 0.38 },
    neck: { x: 0.5, y: 0.48 },
    leftShoulder: { x: 0.38, y: 0.52 },
    rightShoulder: { x: 0.62, y: 0.52 },
    torso: { x: 0.5, y: 0.65 },
    leftArmRaised: false,
    rightArmRaised: false,
    isRoarGesture: false,
    isStompGesture: false,
    isFrozenStill: true,
    isCalibrated: false,
    jumpProgress: 0,
    baselineHeadY: 0.38,
    baselineTorsoY: 0.65,
    torsoY: 0.65,
  };

  private jumpCooldownMs: number = 380;
  private roarCooldownMs: number = 2800;
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
    this.calibrationSamples = [];
    this.stationaryFrames = 0;
    this.prevFrameData = null;
    this.backgroundGray = null;
    this.baselineHeadY = 0.38;
    this.baselineTorsoY = 0.65;
    this.smoothedHeadY = 0.38;
    this.smoothedTorsoY = 0.65;
    this.currentHeadY = 0.38;
    this.currentTorsoY = 0.65;
    this.jumpState = 'grounded';
  }

  /**
   * Immediately snap and calibrate to the user's current standing pose
   */
  public calibrateCurrentPose(): { baselineHeadY: number; baselineTorsoY: number } {
    this.baselineHeadY = Math.max(0.18, Math.min(0.60, this.smoothedHeadY));
    this.baselineTorsoY = Math.max(this.baselineHeadY + 0.15, Math.min(0.85, this.smoothedTorsoY));
    this.isCalibrated = true;
    this.jumpState = 'grounded';
    return { baselineHeadY: this.baselineHeadY, baselineTorsoY: this.baselineTorsoY };
  }

  /**
   * Refined jump & posture thresholds:
   * Requires BOTH head & torso displacement to confirm genuine physical jumps
   */
  private getThresholds() {
    switch (this.sensitivity) {
      case 'low':
        // Less sensitive: requires clear, vigorous physical jump (filters out all fidgeting)
        return {
          headJumpDist: 0.10,
          torsoJumpDist: 0.075,
          jumpVel: 0.065,
          duckDist: 0.14,
          minMotionMass: 0.015,
        };
      case 'high':
        // For gentle hops or young toddlers
        return {
          headJumpDist: 0.055,
          torsoJumpDist: 0.038,
          jumpVel: 0.032,
          duckDist: 0.09,
          minMotionMass: 0.008,
        };
      case 'extreme':
        return {
          headJumpDist: 0.038,
          torsoJumpDist: 0.026,
          jumpVel: 0.022,
          duckDist: 0.07,
          minMotionMass: 0.005,
        };
      case 'normal':
      default:
        // Balanced: requires noticeable upward vertical displacement of upper body
        return {
          headJumpDist: 0.078,
          torsoJumpDist: 0.052,
          jumpVel: 0.048,
          duckDist: 0.11,
          minMotionMass: 0.010,
        };
    }
  }

  public processFrame(now: number): {
    jumpDetected: boolean;
    isDucking: boolean;
    headY: number;
    torsoY: number;
    baselineY: number;
    baselineTorsoY: number;
    motionIntensity: number;
    jumpVelocity: number;
    jumpIntensity: number;
    isFrozenStill: boolean;
    isCalibrated: boolean;
    jumpProgress: number;
    landmarks: PoseLandmarks;
  } {
    if (!this.video || !this.offscreenCtx || this.video.readyState < 2) {
      return {
        jumpDetected: false,
        isDucking: false,
        headY: this.baselineHeadY,
        torsoY: this.baselineTorsoY,
        baselineY: this.baselineHeadY,
        baselineTorsoY: this.baselineTorsoY,
        motionIntensity: 0,
        jumpVelocity: 0,
        jumpIntensity: 1.0,
        isFrozenStill: true,
        isCalibrated: this.isCalibrated,
        jumpProgress: 0,
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
        headY: this.baselineHeadY,
        torsoY: this.baselineTorsoY,
        baselineY: this.baselineHeadY,
        baselineTorsoY: this.baselineTorsoY,
        motionIntensity: 0,
        jumpVelocity: 0,
        jumpIntensity: 1.0,
        isFrozenStill: true,
        isCalibrated: this.isCalibrated,
        jumpProgress: 0,
        landmarks: this.landmarks,
      };
    }

    const data = frame.data;
    const totalPixels = this.width * this.height;

    // Initialize background / prev frame buffers
    if (!this.prevFrameData || this.prevFrameData.length !== data.length) {
      this.prevFrameData = new Uint8ClampedArray(data.length);
      this.prevFrameData.set(data);
      this.backgroundGray = new Float32Array(totalPixels);
      for (let i = 0; i < totalPixels; i++) {
        const idx = i * 4;
        this.backgroundGray[i] = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      }
      return {
        jumpDetected: false,
        isDucking: false,
        headY: this.baselineHeadY,
        torsoY: this.baselineTorsoY,
        baselineY: this.baselineHeadY,
        baselineTorsoY: this.baselineTorsoY,
        motionIntensity: 0,
        jumpVelocity: 0,
        jumpIntensity: 1.0,
        isFrozenStill: true,
        isCalibrated: this.isCalibrated,
        jumpProgress: 0,
        landmarks: this.landmarks,
      };
    }

    let movingPixelCount = 0;
    let sumX = 0;
    let sumY = 0;
    let leftArmPixels = 0;
    let rightArmPixels = 0;

    const rowCounts = new Uint16Array(this.height);
    const colCounts = new Uint16Array(this.width);
    const step = 2; // Subsampling for performance

    // Analyze motion and compute upper body columns
    for (let y = 0; y < this.height; y += step) {
      const rowOffset = y * this.width * 4;
      for (let x = 0; x < this.width; x += step) {
        const idx = rowOffset + x * 4;
        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        const prevGray = (this.prevFrameData[idx] + this.prevFrameData[idx + 1] + this.prevFrameData[idx + 2]) / 3;
        const diff = Math.abs(gray - prevGray);

        // Slow adaptive background model
        if (this.backgroundGray) {
          const pixelIdx = y * this.width + x;
          const bgDiff = Math.abs(gray - this.backgroundGray[pixelIdx]);
          if (diff < 12) {
            this.backgroundGray[pixelIdx] = this.backgroundGray[pixelIdx] * 0.96 + gray * 0.04;
          }
        }

        // Active motion pixel threshold
        if (diff > 18) {
          movingPixelCount++;
          sumX += x;
          sumY += y;
          rowCounts[y]++;
          colCounts[x]++;

          // Arms raised check (upper periphery)
          if (y < this.baselineHeadY * this.height * 1.1) {
            if (x < this.width * 0.32) {
              leftArmPixels++;
            } else if (x > this.width * 0.68) {
              rightArmPixels++;
            }
          }
        }
      }
    }

    // Copy to prev frame
    for (let i = 0; i < data.length; i += 4) {
      this.prevFrameData[i] = data[i];
      this.prevFrameData[i + 1] = data[i + 1];
      this.prevFrameData[i + 2] = data[i + 2];
    }

    const totalSamples = (this.width / step) * (this.height / step);
    const motionRatio = movingPixelCount / totalSamples;
    this.motionIntensity = Math.min(1, motionRatio * 7);

    // Freeze Stillness Check: < 3.5% motion
    const isFrozenStill = this.motionIntensity < 0.035;

    // 1. Identify User Column Corridor (filters out background movement far left/right)
    if (movingPixelCount > 20) {
      this.centerX = (sumX / movingPixelCount) / this.width;
    }
    this.smoothedCenterX += (this.centerX - this.smoothedCenterX) * 0.25;
    const bodyLeftCol = Math.max(0, Math.floor((this.smoothedCenterX - 0.22) * this.width));
    const bodyRightCol = Math.min(this.width, Math.ceil((this.smoothedCenterX + 0.22) * this.width));

    // 2. Extract Half-Skeleton Landmarks (Head Crown, Neck, Shoulders, Torso)
    // To prevent false alarms from small movements, we require a solid vertical cluster,
    // not a single isolated row with 4 pixels.
    let detectedHeadTopRow = -1;
    const minRowPixelsForHead = Math.max(5, Math.floor((this.width / step) * 0.04));

    for (let y = 0; y < this.height - 4; y += step) {
      // Look for 2 consecutive active rows to confirm head structure
      if (rowCounts[y] >= minRowPixelsForHead && rowCounts[y + step] >= minRowPixelsForHead) {
        detectedHeadTopRow = y;
        break;
      }
    }

    let detectedHeadY = this.baselineHeadY;
    let detectedTorsoY = this.baselineTorsoY;

    if (detectedHeadTopRow >= 0) {
      // Head center is slightly below the crown (~4-6% of height)
      detectedHeadY = (detectedHeadTopRow + this.height * 0.06) / this.height;

      // Torso centroid: scan lower half of upper body
      let torsoPixelSum = 0;
      let torsoWeightSum = 0;
      const shoulderStartRow = Math.min(this.height - 1, Math.floor(detectedHeadTopRow + this.height * 0.12));
      const torsoEndRow = Math.min(this.height, Math.floor(detectedHeadTopRow + this.height * 0.45));

      for (let y = shoulderStartRow; y < torsoEndRow; y += step) {
        if (rowCounts[y] > 2) {
          torsoPixelSum += rowCounts[y];
          torsoWeightSum += y * rowCounts[y];
        }
      }

      if (torsoPixelSum > 10) {
        detectedTorsoY = (torsoWeightSum / torsoPixelSum) / this.height;
      } else {
        // Natural anatomical proportion: torso is ~22-26% lower than head
        detectedTorsoY = detectedHeadY + 0.25;
      }
    } else if (movingPixelCount > 30) {
      // Fallback centroid when head top is diffuse
      const centroidY = (sumY / movingPixelCount) / this.height;
      detectedHeadY = Math.max(0.15, centroidY - 0.12);
      detectedTorsoY = Math.min(0.85, centroidY + 0.12);
    }

    // Temporal Smoothing (exponential smoothing filters out high-frequency sensor noise)
    this.smoothedHeadY += (detectedHeadY - this.smoothedHeadY) * 0.32;
    this.smoothedTorsoY += (detectedTorsoY - this.smoothedTorsoY) * 0.28;
    this.currentHeadY = this.smoothedHeadY;
    this.currentTorsoY = this.smoothedTorsoY;

    // Automatic Baseline Calibration during initial 35 frames or when stationary
    if (!this.isCalibrated) {
      if (this.calibrationSamples.length < 35) {
        if (detectedHeadTopRow >= 0 && this.motionIntensity > 0.005) {
          this.calibrationSamples.push({ headY: this.smoothedHeadY, torsoY: this.smoothedTorsoY });
        }
      } else {
        const avgHead = this.calibrationSamples.reduce((a, b) => a + b.headY, 0) / this.calibrationSamples.length;
        const avgTorso = this.calibrationSamples.reduce((a, b) => a + b.torsoY, 0) / this.calibrationSamples.length;
        this.baselineHeadY = Math.max(0.20, Math.min(0.60, avgHead));
        this.baselineTorsoY = Math.max(this.baselineHeadY + 0.15, Math.min(0.85, avgTorso));
        this.isCalibrated = true;
      }
    } else {
      // Slow background baseline drift tracking when user is completely stationary
      if (this.motionIntensity < 0.04) {
        this.stationaryFrames++;
        if (this.stationaryFrames > 60 && detectedHeadTopRow >= 0) {
          // Very gentle baseline correction (0.5% per frame)
          this.baselineHeadY += (this.smoothedHeadY - this.baselineHeadY) * 0.005;
          this.baselineTorsoY += (this.smoothedTorsoY - this.baselineTorsoY) * 0.005;
        }
      } else {
        this.stationaryFrames = 0;
      }
    }

    // Velocity computation (dt = ~16ms)
    const dtSeconds = 0.016;
    const rawHeadVel = (this.currentHeadY - this.prevHeadY) / dtSeconds;
    const rawTorsoVel = (this.currentTorsoY - this.prevTorsoY) / dtSeconds;
    this.prevHeadY = this.currentHeadY;
    this.prevTorsoY = this.currentTorsoY;

    // Smoothed vertical velocities (negative means UPWARD)
    this.headVelocity = this.headVelocity * 0.5 + rawHeadVel * 0.5;
    this.torsoVelocity = this.torsoVelocity * 0.5 + rawTorsoVel * 0.5;
    this.jumpVelocity = 0.4 * this.headVelocity + 0.6 * this.torsoVelocity;

    // 3. Robust Jump Decision Logic:
    // Requires COHERENT upward movement of BOTH Head AND Upper Torso
    const { headJumpDist, torsoJumpDist, jumpVel, duckDist, minMotionMass } = this.getThresholds();
    const headDisplacement = this.baselineHeadY - this.currentHeadY;
    const torsoDisplacement = this.baselineTorsoY - this.currentTorsoY;

    // Progress metric (0.0 to 1.0) for visual radar calibration on front screen
    const rawProgress = Math.max(
      headDisplacement / headJumpDist,
      torsoDisplacement / torsoJumpDist
    );
    const jumpProgress = Math.min(1.0, Math.max(0, rawProgress));

    const hasCooldownElapsed = (now - this.lastJumpTimestamp) > this.jumpCooldownMs;
    const hasSufficientMass = motionRatio >= minMotionMass;

    // Coordinated Upward Movement criteria:
    // 1. Both head AND torso have upward displacement
    // 2. Torso displacement is at least 50% of required torso jump distance
    // 3. Significant upward velocity, OR sustained high elevation of both parts
    const isMovingUpward = this.jumpVelocity < -jumpVel;
    const isHeadLifted = headDisplacement > headJumpDist;
    const isTorsoLifted = torsoDisplacement > torsoJumpDist * 0.70;
    const isHighElevation = headDisplacement > headJumpDist * 1.35 && torsoDisplacement > torsoJumpDist * 1.1;

    let jumpDetected = false;
    let jumpIntensity = 1.0;

    // State machine to prevent bounce multi-triggering
    if (this.jumpState === 'landing' || this.jumpState === 'airborne') {
      // Must descend back near ground baseline to re-arm
      if (torsoDisplacement < torsoJumpDist * 0.35 && headDisplacement < headJumpDist * 0.35) {
        this.jumpState = 'grounded';
      }
    }

    if (this.jumpState === 'grounded' && hasCooldownElapsed && hasSufficientMass) {
      if ((isHeadLifted && isTorsoLifted && isMovingUpward) || isHighElevation) {
        jumpDetected = true;
        this.jumpState = 'airborne';
        this.lastJumpTimestamp = now;
        jumpIntensity = Math.min(1.8, Math.max(0.85, (headDisplacement / headJumpDist + torsoDisplacement / torsoJumpDist) / 2));
        this.onJumpCallback(jumpIntensity);
      }
    }

    // Foot Stomp Detection: fast downward spike
    let isStompGesture = false;
    if (this.jumpVelocity > 0.11 && (now - this.lastStompTimestamp > this.stompCooldownMs)) {
      this.lastStompTimestamp = now;
      isStompGesture = true;
      if (this.onStompGestureCallback) {
        this.onStompGestureCallback();
      }
    }

    // Duck Detection: Both head and torso descend
    const isDucking = (this.currentHeadY - this.baselineHeadY) > duckDist &&
                      (this.currentTorsoY - this.baselineTorsoY) > duckDist * 0.6;
    if (isDucking !== this.isCurrentlyDucking) {
      this.isCurrentlyDucking = isDucking;
      if (this.onDuckChangeCallback) {
        this.onDuckChangeCallback(isDucking);
      }
    }

    // Arms-Raised / Roar Gesture (lateral upper quadrants)
    const leftArmRaised = leftArmPixels > 22;
    const rightArmRaised = rightArmPixels > 22;
    const isRoarGesture = (leftArmRaised && rightArmRaised) || (leftArmPixels + rightArmPixels > 40);

    if (isRoarGesture && (now - this.lastRoarTimestamp > this.roarCooldownMs)) {
      this.lastRoarTimestamp = now;
      if (this.onRoarGestureCallback) {
        this.onRoarGestureCallback();
      }
    }

    // 4. Half-Skeleton Landmarks
    const hY = this.currentHeadY;
    const tY = this.currentTorsoY;
    const neckY = hY + (tY - hY) * 0.35;
    const shoulderY = hY + (tY - hY) * 0.45;
    const shoulderHalfWidth = 0.12;

    this.landmarks = {
      head: { x: this.smoothedCenterX, y: hY },
      neck: { x: this.smoothedCenterX, y: neckY },
      leftShoulder: { x: Math.max(0.08, this.smoothedCenterX - shoulderHalfWidth), y: shoulderY },
      rightShoulder: { x: Math.min(0.92, this.smoothedCenterX + shoulderHalfWidth), y: shoulderY },
      torso: { x: this.smoothedCenterX, y: tY },
      leftArmRaised,
      rightArmRaised,
      isRoarGesture,
      isStompGesture,
      isFrozenStill,
      isCalibrated: this.isCalibrated,
      jumpProgress,
      baselineHeadY: this.baselineHeadY,
      baselineTorsoY: this.baselineTorsoY,
      torsoY: tY,
      spineLength: tY - hY,
    };

    return {
      jumpDetected,
      isDucking,
      headY: this.currentHeadY,
      torsoY: this.currentTorsoY,
      baselineY: this.baselineHeadY,
      baselineTorsoY: this.baselineTorsoY,
      motionIntensity: this.motionIntensity,
      jumpVelocity: this.jumpVelocity,
      jumpIntensity,
      isFrozenStill,
      isCalibrated: this.isCalibrated,
      jumpProgress,
      landmarks: this.landmarks,
    };
  }

  /**
   * Render real-time half-skeleton, jump target line, baseline, and alignment box
   */
  public renderOverlay(
    canvas: HTMLCanvasElement,
    stats: {
      headY: number;
      baselineY: number;
      torsoY?: number;
      baselineTorsoY?: number;
      isJumping: boolean;
      isDucking: boolean;
      motionIntensity: number;
      isFrozenStill?: boolean;
      isCalibrated?: boolean;
      jumpProgress?: number;
      landmarks?: PoseLandmarks;
    }
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const { headJumpDist, duckDist } = this.getThresholds();
    const baseY = stats.baselineY * h;
    const jumpY = (stats.baselineY - headJumpDist) * h;
    const duckY = (stats.baselineY + duckDist) * h;

    // Jump Zone Highlight
    ctx.fillStyle = 'rgba(16, 185, 129, 0.10)';
    ctx.fillRect(0, 0, w, Math.max(0, jumpY));

    // Jump Threshold Line
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(0, jumpY);
    ctx.lineTo(w, jumpY);
    ctx.stroke();

    // Baseline Line
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    ctx.lineTo(w, baseY);
    ctx.stroke();

    // Duck Threshold Line
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, duckY);
    ctx.lineTo(w, duckY);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('▲ JUMP LINE', 6, Math.max(12, jumpY - 4));

    ctx.fillStyle = '#06b6d4';
    ctx.fillText('— HEAD BASELINE', 6, baseY - 4);

    // Half Skeleton Rendering
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

      const skeletonColor = stats.isJumping
        ? '#10b981'
        : stats.isDucking
        ? '#f59e0b'
        : '#38bdf8';

      // 1. Spine (Head -> Neck -> Torso)
      ctx.strokeStyle = skeletonColor;
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(hX, hY);
      ctx.lineTo(nX, nY);
      ctx.lineTo(tX, tY);
      ctx.stroke();

      // 2. Shoulder Bar (Left Shoulder -> Right Shoulder)
      ctx.beginPath();
      ctx.moveTo(lsX, lsY);
      ctx.lineTo(rsX, rsY);
      ctx.stroke();

      // 3. Head Halo / Circle
      ctx.beginPath();
      ctx.arc(hX, hY, 10, 0, Math.PI * 2);
      ctx.fillStyle = stats.isJumping ? '#10b981' : 'rgba(56, 189, 248, 0.4)';
      ctx.fill();
      ctx.strokeStyle = skeletonColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // 4. Arms (if raised to roar)
      if (lm.leftArmRaised) {
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(lsX, lsY);
        ctx.lineTo(lsX - 16, lsY - 22);
        ctx.stroke();
      }
      if (lm.rightArmRaised) {
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(rsX, rsY);
        ctx.lineTo(rsX + 16, rsY - 22);
        ctx.stroke();
      }

      // 5. Joint Nodes
      ctx.fillStyle = stats.isJumping ? '#34d399' : '#0284c7';
      [
        [nX, nY],
        [lsX, lsY],
        [rsX, rsY],
        [tX, tY],
      ].forEach(([jx, jy]) => {
        ctx.beginPath();
        ctx.arc(jx, jy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Stillness indicator
      if (stats.isFrozenStill) {
        ctx.fillStyle = '#06b6d4';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('❄️ STILL', w - 48, 14);
      }
    }

    // Bottom Jump Power Meter
    const progress = stats.jumpProgress ?? (lm?.jumpProgress || 0);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(0, h - 6, w, 6);
    ctx.fillStyle = progress >= 1.0 ? '#10b981' : progress > 0.5 ? '#f59e0b' : '#38bdf8';
    ctx.fillRect(0, h - 6, w * progress, 6);
  }
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { MotionDetector } from '../utils/motionDetector';
import { PoseLandmarks } from '../game/types';

export interface UseCameraMotionOptions {
  sensitivity?: 'low' | 'normal' | 'high' | 'extreme';
  facingMode?: 'user' | 'environment';
  onJump?: (intensity: number) => void;
  onDuckChange?: (isDucking: boolean) => void;
  onRoarGesture?: () => void;
  onStompGesture?: () => void;
}

export function useCameraMotion(options: UseCameraMotionOptions = {}) {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(options.facingMode || 'user');
  const [sensitivity, setSensitivityState] = useState<'low' | 'normal' | 'high' | 'extreme'>(
    options.sensitivity || 'normal'
  );

  const [stats, setStats] = useState({
    baselineY: 0.45,
    currentHeadY: 0.45,
    isJumping: false,
    isDucking: false,
    motionIntensity: 0,
    jumpVelocity: 0,
    jumpIntensity: 1.0,
    isFrozenStill: true,
    landmarks: undefined as PoseLandmarks | undefined,
  });

  const [jumpFlash, setJumpFlash] = useState<boolean>(false);
  const [roarFlash, setRoarFlash] = useState<boolean>(false);
  const [stompFlash, setStompFlash] = useState<boolean>(false);
  const [physicalJumpCount, setPhysicalJumpCount] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hudCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<MotionDetector | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const onJumpRef = useRef(options.onJump);
  const onDuckChangeRef = useRef(options.onDuckChange);
  const onRoarGestureRef = useRef(options.onRoarGesture);
  const onStompGestureRef = useRef(options.onStompGesture);

  useEffect(() => {
    onJumpRef.current = options.onJump;
    onDuckChangeRef.current = options.onDuckChange;
    onRoarGestureRef.current = options.onRoarGesture;
    onStompGestureRef.current = options.onStompGesture;
  }, [options.onJump, options.onDuckChange, options.onRoarGesture, options.onStompGesture]);

  const handleJump = useCallback((intensity: number) => {
    setJumpFlash(true);
    setTimeout(() => setJumpFlash(false), 280);
    setPhysicalJumpCount((c) => c + 1);
    if (onJumpRef.current) {
      onJumpRef.current(intensity);
    }
  }, []);

  const handleDuckChange = useCallback((isDucking: boolean) => {
    if (onDuckChangeRef.current) {
      onDuckChangeRef.current(isDucking);
    }
  }, []);

  const handleRoarGesture = useCallback(() => {
    setRoarFlash(true);
    setTimeout(() => setRoarFlash(false), 600);
    if (onRoarGestureRef.current) {
      onRoarGestureRef.current();
    }
  }, []);

  const handleStompGesture = useCallback(() => {
    setStompFlash(true);
    setTimeout(() => setStompFlash(false), 500);
    if (onStompGestureRef.current) {
      onStompGestureRef.current();
    }
  }, []);

  useEffect(() => {
    const detector = new MotionDetector({
      sensitivity,
      onJump: handleJump,
      onDuckChange: handleDuckChange,
      onRoarGesture: handleRoarGesture,
      onStompGesture: handleStompGesture,
    });
    detectorRef.current = detector;

    return () => {
      detectorRef.current = null;
    };
  }, [sensitivity, handleJump, handleDuckChange, handleRoarGesture, handleStompGesture]);

  const setSensitivity = useCallback((level: 'low' | 'normal' | 'high' | 'extreme') => {
    setSensitivityState(level);
    if (detectorRef.current) {
      detectorRef.current.setSensitivity(level);
    }
  }, []);

  const recalibrate = useCallback(() => {
    if (detectorRef.current) {
      detectorRef.current.resetCalibration();
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Mobile-Optimized Camera Stream Acquisition with automatic fallback
  const startCamera = useCallback(async (targetFacingMode?: 'user' | 'environment') => {
    const mode = targetFacingMode || facingMode;
    try {
      setCameraError(null);

      // Check secure context (HTTPS required on mobile)
      if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        throw new Error('Mobile camera requires a secure HTTPS URL. Please verify your deployment is using https://');
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this mobile browser.');
      }

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      // Mobile friendly constraints list with cascading fallbacks
      const constraintOptions: MediaStreamConstraints[] = [
        {
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 480 },
            height: { ideal: 360 },
          },
          audio: false,
        },
        {
          video: {
            facingMode: mode,
          },
          audio: false,
        },
        {
          video: true,
          audio: false,
        },
      ];

      let stream: MediaStream | null = null;
      let lastError: unknown = null;

      for (const constraints of constraintOptions) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (stream) break;
        } catch (e) {
          lastError = e;
        }
      }

      if (!stream) {
        throw lastError || new Error('Could not open camera stream.');
      }

      streamRef.current = stream;

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.muted = true;
        video.defaultMuted = true;

        try {
          await video.play();
        } catch {
          // In some iOS webviews, play needs another user interaction; we don't crash
        }

        if (detectorRef.current) {
          detectorRef.current.setVideo(video);
        }
      }

      setHasPermission(true);
      setCameraActive(true);
    } catch (err: unknown) {
      console.warn('Camera initialization error on device:', err);
      let message = 'Could not access camera.';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          message = 'Camera permission was denied. Tap the lock/tune icon in your address bar to allow camera access.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          message = 'No camera found on this device.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          message = 'Camera is already in use by another app or browser tab.';
        } else {
          message = err.message;
        }
      }
      setCameraError(message);
      setHasPermission(false);
      setCameraActive(false);
    }
  }, [facingMode]);

  // Flip front/back camera
  const toggleFacingMode = useCallback(() => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    if (cameraActive) {
      startCamera(nextMode);
    }
  }, [facingMode, cameraActive, startCamera]);

  // Frame processing loop
  useEffect(() => {
    if (!cameraActive) return;

    let isRunning = true;

    const loop = (timestamp: number) => {
      if (!isRunning) return;

      if (detectorRef.current && videoRef.current) {
        const frameResult = detectorRef.current.processFrame(timestamp);

        setStats({
          baselineY: frameResult.baselineY,
          currentHeadY: frameResult.headY,
          isJumping: frameResult.jumpDetected,
          isDucking: frameResult.isDucking,
          motionIntensity: frameResult.motionIntensity,
          jumpVelocity: frameResult.jumpVelocity,
          jumpIntensity: frameResult.jumpIntensity,
          isFrozenStill: frameResult.isFrozenStill,
          landmarks: frameResult.landmarks,
        });

        if (hudCanvasRef.current) {
          detectorRef.current.renderOverlay(hudCanvasRef.current, {
            headY: frameResult.headY,
            baselineY: frameResult.baselineY,
            isJumping: frameResult.jumpDetected,
            isDucking: frameResult.isDucking,
            motionIntensity: frameResult.motionIntensity,
            isFrozenStill: frameResult.isFrozenStill,
            landmarks: frameResult.landmarks,
          });
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [cameraActive]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const triggerManualJump = useCallback(() => {
    handleJump(1.0);
  }, [handleJump]);

  const triggerManualRoar = useCallback(() => {
    handleRoarGesture();
  }, [handleRoarGesture]);

  const triggerManualStomp = useCallback(() => {
    handleStompGesture();
  }, [handleStompGesture]);

  return {
    cameraActive,
    hasPermission,
    cameraError,
    facingMode,
    toggleFacingMode,
    videoRef,
    hudCanvasRef,
    stats,
    motionIntensity: stats.motionIntensity,
    isFrozenStill: stats.isFrozenStill,
    jumpFlash,
    roarFlash,
    stompFlash,
    physicalJumpCount,
    sensitivity,
    setSensitivity,
    recalibrate,
    startCamera,
    stopCamera,
    triggerManualJump,
    triggerManualRoar,
    triggerManualStomp,
  };
}

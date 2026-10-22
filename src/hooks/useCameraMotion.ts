import { useState, useEffect, useRef, useCallback } from 'react';
import { MotionDetector } from '../utils/motionDetector';
import { PoseLandmarks } from '../game/types';

export interface UseCameraMotionOptions {
  sensitivity?: 'low' | 'normal' | 'high' | 'extreme';
  onJump?: (intensity: number) => void;
  onDuckChange?: (isDucking: boolean) => void;
  onRoarGesture?: () => void;
  onStompGesture?: () => void;
}

export function useCameraMotion(options: UseCameraMotionOptions = {}) {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
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

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 60, max: 60 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        if (detectorRef.current) {
          detectorRef.current.setVideo(videoRef.current);
        }
      }

      setHasPermission(true);
      setCameraActive(true);
    } catch (err: unknown) {
      console.warn('Camera initialization error:', err);
      const message = err instanceof Error ? err.message : 'Could not access camera.';
      setCameraError(message);
      setHasPermission(false);
      setCameraActive(false);
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

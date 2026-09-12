// Shared webcam + hand-landmark overlay for any screen using
// recognition/useSignRecognition(). Markup matches
// src/recognition/README.md's integration example (mirrored video/canvas;
// classification itself uses unmirrored coordinates internally).
import type { RefObject } from "react";

type RecognitionCameraProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
};

export function RecognitionCamera({ videoRef, canvasRef }: RecognitionCameraProps) {
  return (
    <div className="relative mx-auto aspect-[4/3] max-w-md overflow-hidden rounded-xl bg-slate-950">
      <video ref={videoRef} muted playsInline className="h-full w-full -scale-x-100" />
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100" />
    </div>
  );
}

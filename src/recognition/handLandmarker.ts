import type { Landmark } from './types';

export interface HandLandmarker {
  detectForVideo(video: HTMLVideoElement, timestamp: number): {
    landmarks: Landmark[][];
  };
  close(): void;
}
type VisionModule = {
  FilesetResolver: { forVisionTasks(path: string): Promise<unknown> };
  HandLandmarker: { createFromOptions(files: unknown, options: object): Promise<HandLandmarker> };
};

// Pin JS and WASM together. Browser loading keeps A's changes in recognition/.
export const MEDIAPIPE_VERSION = '0.10.32';
const BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}`;
const MODULE_URL = `${BASE}/vision_bundle.mjs`;
export async function loadHandLandmarker(): Promise<HandLandmarker> {
  const vision = await import(/* @vite-ignore */ MODULE_URL) as VisionModule;
  const files = await vision.FilesetResolver.forVisionTasks(`${BASE}/wasm`);
  return vision.HandLandmarker.createFromOptions(files, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
      delegate: 'CPU',
    },
    runningMode: 'VIDEO', numHands: 1,
    minHandDetectionConfidence: 0.6, minHandPresenceConfidence: 0.6, minTrackingConfidence: 0.6,
  });
}

const CHAINS = [[0,1,2,3,4],[0,5,6,7,8],[5,9,10,11,12],[9,13,14,15,16],[13,17,18,19,20],[0,17]];
export function drawLandmarks(canvas: HTMLCanvasElement, video: HTMLVideoElement,
  points: readonly Landmark[] = []) {
  if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
  if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;
  const context = canvas.getContext('2d');
  if (!context) return;
  context.clearRect(0,0,canvas.width,canvas.height);
  context.strokeStyle = '#34d399'; context.fillStyle = '#fff'; context.lineWidth = 3;
  for (const chain of CHAINS) {
    for (let i=1; i<chain.length; i++) {
      const a = points[chain[i-1]], b = points[chain[i]];
      if (!a || !b) continue;
      context.beginPath(); context.moveTo(a.x*canvas.width,a.y*canvas.height);
      context.lineTo(b.x*canvas.width,b.y*canvas.height); context.stroke();
    }
  }
  for (const point of points) {
    context.beginPath(); context.arc(point.x*canvas.width,point.y*canvas.height,4,0,Math.PI*2); context.fill();
  }
}

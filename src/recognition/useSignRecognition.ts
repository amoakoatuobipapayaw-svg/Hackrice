import { useCallback, useEffect, useRef, useState } from 'react';
import type { HandLandmarker } from './handLandmarker';
import { loadHandLandmarker, drawLandmarks } from './handLandmarker';
import { classifySign } from './signClassifier';
import { geminiCoach } from './geminiCoach';
import { useRecognitionState } from './useRecognitionState';
import type { Recognition, RecognitionOptions } from './types';

export function useSignRecognition(options: RecognitionOptions = {}): Recognition {
  const { current, confirmed, correctReps, holdProgress, reset, clearHold, accept, optionsRef } = useRecognitionState(options);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status,setStatus] = useState<Recognition['status']>('idle');
  const [error,setError] = useState<string|null>(null);
  const [coachingFeedback,setCoachingFeedback] = useState<{key:string; line:string}|null>(null);
  const coachingKey = JSON.stringify([options.target,options.vocabulary ?? 'letters']);
  const coachingLine = options.coaching && coachingFeedback?.key === coachingKey ? coachingFeedback.line : null;
  const session = useRef(0);
  const active = useRef(false);
  const stream = useRef<MediaStream|null>(null);
  const model = useRef<HandLandmarker|null>(null);
  const frame = useRef(0);
  const coach = useRef<AbortController|null>(null);
  const startupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cleanup = useCallback(() => {
    session.current++; active.current = false; cancelAnimationFrame(frame.current);
    if (startupTimer.current) clearTimeout(startupTimer.current);
    startupTimer.current = null;
    coach.current?.abort(); coach.current = null;
    stream.current?.getTracks().forEach(track => { track.onended = null; track.stop(); });
    stream.current = null; model.current?.close(); model.current = null;
    if (videoRef.current) { videoRef.current.pause(); videoRef.current.srcObject = null; }
    const canvas = canvasRef.current;
    canvas?.getContext('2d')?.clearRect(0,0,canvas.width,canvas.height);
  }, []);
  const stop = useCallback(() => {
    cleanup(); clearHold(); setStatus('idle'); setCoachingFeedback(null);
  }, [cleanup,clearHold]);
  const start = useCallback(() => {
    if (active.current) return;
    active.current = true; const id = ++session.current;
    const alive = () => session.current === id;
    setStatus('loading'); setError(null); setCoachingFeedback(null); clearHold();
    const fail = (cause: unknown) => {
      if (!alive()) return;
      cleanup(); clearHold(); setStatus('error');
      setError(cause instanceof Error ? cause.message : 'Camera recognition could not start.');
    };
    startupTimer.current = setTimeout(() => fail(new Error('Camera/model startup timed out. Check camera permission and internet, then retry.')), 30000);
    void (async () => {
      try {
        const video = videoRef.current;
        if (!video) throw new Error('Mount a <video ref={videoRef} muted playsInline /> before starting.');
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera access needs HTTPS or localhost.');
        const camera = await navigator.mediaDevices.getUserMedia({
          audio:false, video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},
        });
        if (!alive()) { camera.getTracks().forEach(track => track.stop()); return; }
        stream.current = camera; video.srcObject = camera; video.muted = true; video.playsInline = true;
        camera.getVideoTracks().forEach(track => { track.onended = () => fail(new Error('Camera disconnected. Press Start to retry.')); });
        await video.play();
        if (!alive()) return;
        const detector = await loadHandLandmarker();
        if (!alive()) { detector.close(); return; }
        model.current = detector;
        if (startupTimer.current) clearTimeout(startupTimer.current);
        startupTimer.current = null; setStatus('running');
        let lastVideoTime = -1, lastInference = -Infinity, lastCoach = -Infinity;
        const loop = (now: number) => {
          if (!alive()) return;
          try {
            if (video.readyState >= 2 && video.currentTime !== lastVideoTime && now-lastInference >= 66) {
              lastVideoTime = video.currentTime; lastInference = now;
              const points = detector.detectForVideo(video,now).landmarks[0];
              const settings = optionsRef.current;
              const current = points ? classifySign(points, {
                vocabulary:settings.vocabulary,aspectRatio:video.videoWidth/video.videoHeight,
              }) : null;
              accept(current,now);
              if (canvasRef.current) drawLandmarks(canvasRef.current,video,points);
              if (settings.coaching && points && !coach.current && now-lastCoach >= 5000) {
                lastCoach = now;
                const controller = new AbortController(); coach.current = controller;
                const target = settings.target;
                const key = JSON.stringify([target,settings.vocabulary ?? 'letters']);
                void geminiCoach(JSON.stringify({target, vocabulary:settings.vocabulary ?? 'letters', current,
                  note: 'Coordinates only; heuristic label may be wrong. Do not infer movement from this frame.',
                  landmarks:points.map(({x,y,z}) => ({x:+x.toFixed(3),y:+y.toFixed(3),z:+z.toFixed(3)})),
                }),controller.signal).then(line => {
                  if (alive() && optionsRef.current.coaching && optionsRef.current.target === target) setCoachingFeedback({key,line});
                }).catch(() => {
                  if (alive() && !controller.signal.aborted) setCoachingFeedback({key,line:'Coaching unavailable. Recognition still works.'});
                }).finally(() => { if (coach.current === controller) coach.current = null; });
              }
            } else if (now-lastInference > 250) {
              accept(null,now);
              if (canvasRef.current) drawLandmarks(canvasRef.current,video);
            }
            frame.current = requestAnimationFrame(loop);
          } catch (cause) { fail(cause); }
        };
        frame.current = requestAnimationFrame(loop);
      } catch (cause) { fail(cause); }
    })();
  }, [cleanup,accept,clearHold,optionsRef]);
  useEffect(() => {
    coach.current?.abort();
  }, [options.coaching,options.target,options.vocabulary]);
  useEffect(() => {
    const hidden = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange',hidden);
    return () => { document.removeEventListener('visibilitychange',hidden); cleanup(); };
  }, [cleanup,stop]);
  return {current:current, confirmed:confirmed, correctReps:correctReps,
    holdProgress:holdProgress, reset:reset, videoRef, canvasRef,
    status,error,coachingLine,start,stop};
}

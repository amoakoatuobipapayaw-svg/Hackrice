// Tiny built-in sound effects via the Web Audio API — no audio assets to
// ship or fetch, so they play instantly and work offline. One shared
// AudioContext, created lazily since browsers block audio before a user
// gesture; by the time either sound fires, the user has already interacted
// with the app (started a round, held the mic), so this never gets blocked.
let ctx: AudioContext | null = null;
function getCtx(): AudioContext {
  ctx ??= new AudioContext();
  return ctx;
}

function tone(ac: AudioContext, freq: number, startTime: number, duration: number, gainPeak: number): void {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

/** Short two-note upward chime for a confirmed sign or correct answer. */
export function playCorrectChime(): void {
  try {
    const ac = getCtx();
    const now = ac.currentTime;
    tone(ac, 880, now, 0.12, 0.15);
    tone(ac, 1318.5, now + 0.09, 0.18, 0.15);
  } catch {
    // Audio blocked or unavailable — the visual flourish still lands, and
    // sound is a bonus here, never worth surfacing an error over.
  }
}

/** Longer four-note ascending fanfare for a level-up. */
export function playLevelUpFanfare(): void {
  try {
    const ac = getCtx();
    const now = ac.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => tone(ac, freq, now + i * 0.1, 0.25, 0.12));
  } catch {
    // see playCorrectChime
  }
}

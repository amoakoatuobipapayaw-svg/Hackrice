// One ASL sign clip with a big custom play button, instead of the browser's
// native <video controls> — at the small widths these clips are shown, native
// controls collapse into an overflow "···" menu that hides the play button
// entirely. Click/tap anywhere on the clip to toggle play/pause.
import { useRef, useState } from "react";

export function SignVideoClip({ src, word }: { src: string; word: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="group relative block w-full overflow-hidden rounded-xl border border-line bg-canvas"
      aria-label={`${playing ? "Pause" : "Play"} the sign for ${word}`}
    >
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        className="block w-full"
      />
      {!playing && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/35">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-brand shadow-md transition-transform group-hover:scale-110 group-active:scale-95">
            <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
          </span>
        </span>
      )}
    </button>
  );
}

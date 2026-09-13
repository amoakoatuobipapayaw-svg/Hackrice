// One ASL sign clip with a big custom play button, instead of the browser's
// native <video controls> — at the small widths these clips are shown, native
// controls collapse into an overflow "···" menu that hides the play button
// entirely. Click/tap anywhere on the clip to toggle play/pause; a small
// "···" button in the corner opens full-screen playback instead (its own
// control, not the browser's buried one, for the same reason as the play
// button — it needs to stay reachable at this size).
//
// Every ASL Citizen clip is 640x480 (checked directly against the mp4s'
// tkhd boxes — the dataset ships one fixed webcam resolution), and the
// signer doesn't fill that whole 4:3 frame — there's real background/margin
// on the sides. object-cover + a taller-than-wide aspect ratio crops that
// margin away and zooms toward center, where the signer already is, rather
// than showing the raw frame letterboxed inside a narrower card.
import { useRef, useState, type MouseEvent } from "react";

export function SignVideoClip({ src, word }: { src: string; word: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
  }

  function openFullscreen(e: MouseEvent) {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    // iOS Safari has no element Fullscreen API — <video>'s own
    // webkitEnterFullscreen is the only way to get full-screen playback there.
    const iosVideo = video as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    if (iosVideo.webkitEnterFullscreen) iosVideo.webkitEnterFullscreen();
    else if (video.requestFullscreen) void video.requestFullscreen();
  }

  return (
    <div className="group relative block aspect-square w-full overflow-hidden rounded-xl border border-line bg-canvas">
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        preload="metadata"
        onLoadedMetadata={(e) => {
          // Seeking forces the browser to decode and paint that instant as a
          // still frame — a real preview of the sign instead of a flat gray
          // box, without downloading the whole clip or generating (and
          // hosting) a separate poster image per word.
          const video = e.currentTarget;
          if (video.currentTime === 0) video.currentTime = Math.min(0.15, video.duration / 2);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={(e) => {
          setPlaying(false);
          // Otherwise it freezes on the final frame instead of the poster.
          const video = e.currentTarget;
          video.currentTime = Math.min(0.15, video.duration / 2);
        }}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <button
        type="button"
        onClick={toggle}
        className="absolute inset-0"
        aria-label={`${playing ? "Pause" : "Play"} the sign for ${word}`}
      >
        {!playing && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/35">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-brand shadow-md transition-transform group-hover:scale-110 group-active:scale-95">
              <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
            </span>
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={openFullscreen}
        aria-label={`View the sign for ${word} full screen`}
        className="absolute top-1.5 right-1.5 z-10 flex h-7 w-7 items-center justify-center gap-0.5 rounded-full bg-black/45 text-white transition-colors hover:bg-black/65 focus-visible:outline-2 focus-visible:outline-white"
      >
        <span aria-hidden="true" className="h-1 w-1 rounded-full bg-current" />
        <span aria-hidden="true" className="h-1 w-1 rounded-full bg-current" />
        <span aria-hidden="true" className="h-1 w-1 rounded-full bg-current" />
      </button>
    </div>
  );
}

// A real illustrated ASL handshape for one letter, shown instead of
// HandHint's geometric dot diagram wherever a learner is asked to copy a
// letter shape. Public-domain manual-alphabet illustrations (wpclipart.com,
// via Wikimedia Commons: commons.wikimedia.org/wiki/Category:ASL_letters —
// "released into the public domain... for any purpose, without any
// conditions"), downloaded once and self-hosted under public/letter-signs/
// rather than hotlinked. Fetched as Commons' own 250px PNG thumbnails, not
// the original SVGs — their CDN rate-limits repeated original-file fetches
// (rightly so for a one-time bulk download) but not the thumbnail path, and
// 250px is plenty for the ~132px this renders at. Digits have no equivalent
// public-domain source, so they still use HandHint's dot diagram — this
// component only covers A-Z.
export function LetterHint({ letter, size = 132 }: { letter: string; size?: number }) {
  const upper = letter.toUpperCase();
  return (
    <img
      src={`/letter-signs/${upper}.png`}
      alt={`ASL handshape for the letter ${upper}`}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="rounded-xl border-2 border-line bg-white object-contain p-2"
    />
  );
}

/** Whether `sign` is a letter LetterHint has an illustration for (A-Z only — not digits or word signs). */
export function hasLetterHint(sign: string): boolean {
  return /^[A-Z]$/.test(sign.toUpperCase());
}

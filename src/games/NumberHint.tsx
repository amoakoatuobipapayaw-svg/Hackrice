// Real illustrated ASL handshapes for digits, shown instead of HandHint's
// geometric dot diagram wherever a learner is asked to copy a digit shape —
// the numeral counterpart to LetterHint.tsx. Two different sources, both via
// Wikimedia Commons' Category:ASL_numbers:
// - 0: public domain (Asl_alphabet_gallaudet_(zero).svg — Ds13, vectorized
//   by Marnanel, cropped by Alexis Jazz).
// - 1-9: photos by Commons user Snailsmakemehappy, CC BY-SA 4.0 — this one
//   DOES require attribution ("give appropriate credit... indicate if
//   changes were made"), credited in SignGuide's footnote since that's
//   this component's only caller.
// Fetched once as Commons' 250px thumbnails (their CDN rate-limits repeated
// original-file fetches, not the thumbnail path) and self-hosted under
// public/number-signs/ rather than hotlinked.
const EXT: Record<string, string> = { '0': 'png' };

export function NumberHint({ digit, size = 132 }: { digit: string; size?: number }) {
  const ext = EXT[digit] ?? 'jpg';
  return (
    <img
      src={`/number-signs/${digit}.${ext}`}
      alt={`ASL handshape for the number ${digit}`}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="rounded-xl border-2 border-line bg-white object-contain p-2"
    />
  );
}

/** Whether `sign` is a digit NumberHint has an illustration for (0-9 only). */
export function hasNumberHint(sign: string): boolean {
  return /^[0-9]$/.test(sign);
}

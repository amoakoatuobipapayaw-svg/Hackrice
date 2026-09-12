// TODO(B): show a target sign, score the user's attempt via
// useSignRecognition(), show the live score + coaching line, advance on
// success. A short lesson = 5 signs.
import { useSignRecognition } from "../recognition/useSignRecognition";

export function Lesson() {
  const recognition = useSignRecognition();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Lesson</h1>
      <p className="mt-2 text-slate-400">
        🚧 Build me — Workstream B. Recognized so far: {recognition.current?.label ?? "—"}
      </p>
    </div>
  );
}

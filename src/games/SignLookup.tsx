// A "how do you sign this" search: type a word or short phrase, see real
// ASL video for each word that has one. Backed by a curated subset of the
// Microsoft ASL Citizen dataset (src/dictionary/, see its top comment for
// license/scope notes) — no camera, no recognition, just a reference lookup.
import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { Caption } from "../voice/Caption";
import { useVoice } from "../voice/useVoice";
import { GameLayout } from "./GameLayout";
import { SignPhrase } from "./SignPhrase";

const EXAMPLES = ["hello", "thank you", "my name is", "nice to meet you", "how are you"];

export function SignLookup() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const voice = useVoice();

  return (
    <GameLayout
      mode="Sign dictionary"
      title="Look up how to sign it."
      description="Type a word or a short phrase. ASL doesn't have a sign for every English word, or the same grammar as English — this shows each recognized word's sign in order, not a fluent translation."
      progress={0}
      progressLabel="Search as many as you like"
    >
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => { event.preventDefault(); setSubmitted(query); }}
      >
        <label className="sr-only" htmlFor="sign-lookup-input">Word or phrase to look up</label>
        <input
          id="sign-lookup-input"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try “thank you” or “my name is…”"
          className="flex-1 rounded-xl border-2 border-line bg-surface px-4 py-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2"
        />
        <Button type="submit" disabled={!query.trim()}>Look up</Button>
      </form>

      <p className="mt-3 text-xs text-muted">
        Try: {EXAMPLES.map((example, i) => (
          <span key={example}>
            {i > 0 && ", "}
            <button type="button" className="underline underline-offset-2 hover:text-brand" onClick={() => { setQuery(example); setSubmitted(example); }}>{example}</button>
          </span>
        ))}
      </p>

      {submitted && (
        <div className="mt-6 rounded-2xl border-2 border-line bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-extrabold tracking-widest text-brand uppercase">“{submitted}”</p>
            <button
              type="button"
              onClick={() => void voice.speak(submitted)}
              disabled={voice.isSpeaking}
              className="flex items-center gap-1.5 rounded-lg border-2 border-line bg-surface px-3 py-1.5 text-xs font-extrabold tracking-wide text-brand uppercase hover:bg-soft disabled:opacity-60"
            >
              <Icon name="volume" size={16} />
              {voice.isSpeaking ? "Speaking…" : "Hear it"}
            </button>
          </div>
          <div className="mt-4"><SignPhrase text={submitted} /></div>
          <div className="mt-3"><Caption caption={voice.caption} isSpeaking={voice.isSpeaking} isListening={voice.isListening} isTranscribing={voice.isTranscribing} /></div>
        </div>
      )}

      <p className="mt-7 text-xs leading-relaxed text-muted">
        Video clips are a small curated subset of{" "}
        <a href="https://www.microsoft.com/en-us/research/project/asl-citizen/" target="_blank" rel="noreferrer" className="underline underline-offset-2">Microsoft's ASL Citizen dataset</a>
        {" "}— real Deaf and hard-of-hearing signers, used here under its non-commercial research license.
      </p>
    </GameLayout>
  );
}

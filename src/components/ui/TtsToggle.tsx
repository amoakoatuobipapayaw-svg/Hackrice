import { useState } from "react";
import { Button } from "./Button";
import { getTtsEnabled, setTtsEnabled } from "../../voice/ttsPreference";

/** Lets a user change their onboarding answer to "speak prompts/answers
 * aloud?" at any time — useVoice()'s speak() reads this same preference. */
export function TtsToggle() {
  const [enabled, setEnabled] = useState(getTtsEnabled);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    setTtsEnabled(next);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      aria-pressed={enabled}
      title="Toggle spoken prompts and answers"
      onClick={toggle}
      className="px-3 py-2 text-xs"
    >
      {enabled ? "Voice: on" : "Voice: off"}
    </Button>
  );
}

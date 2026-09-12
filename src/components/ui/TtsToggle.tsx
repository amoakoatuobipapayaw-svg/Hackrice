import { useState } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";
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
      className="flex items-center justify-start gap-2 px-2.5 py-2 text-xs tracking-normal whitespace-nowrap"
    >
      <Icon name={enabled ? "volume" : "volumeOff"} size={16} />
      <span className="sr-only sm:not-sr-only">{enabled ? "Voice: on" : "Voice: off"}</span>
    </Button>
  );
}

# Signly game experience

The visual layout follows the sidebar, winding learning path, raised buttons,
and progress-card patterns in https://github.com/sanidhyy/duolingo-clone.
The implementation is original React/Tailwind code; no assets or source code were
copied and no new packages were added. Home links each path node to a working
practice mode without implying tracked completion or locked lessons.

White surfaces, green actions and blue selected navigation use shared semantic
tokens in `src/globals.css`, including high-contrast overrides. The sidebar becomes
a compact top navigation on phones. Camera and sign guide sit side by side from
tablet widths. Supported lesson targets remain I/L/V/W/Y; Math answers remain 1–9.

- `GameLayout.tsx`: mode navigation, page headings, progress and profile entry.
- `SignGuide.tsx`: three-step hand-shape instructions and lesson milestones.
- `CameraPanel.tsx`: camera setup, loading, error/retry, pause, detected shape,
  and hold feedback. Both video and overlay remain mounted before camera start.
- `RoundComplete.tsx`: earned XP, confirmed signs, score and retry navigation.
- Lesson stops its camera at completion; retry starts with the camera off.
- Speed pauses the clock during setup, camera errors, and camera pauses.
- Math cancels its pending advancement timer when leaving the screen.

Run `npm run dev` and visit `/lesson`, `/speed`, or `/math`. Choose a local profile
name first. Plain Vite does not serve voice or coaching APIs; those require a
configured Vercel development environment or deployment. Real camera tests should
cover a full lesson, retry, pausing/resuming Speed, and Math voice/sign answers.
The local preview is not a production deployment.

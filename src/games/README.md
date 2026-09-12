# SignQuest game experience

This pass was requested to improve B's game UI. It uses the lesson-progress and
clear answer-feedback ideas from https://github.com/sanidhyy/duolingo-clone as
inspiration. No code, illustrations, or branding were copied, and no new
packages were added. The shared top navigation in `src/app/Nav.tsx` also
wraps on small screens to prevent horizontal overflow.

The SignQuest studio uses violet for learning, mint for progress, and amber for
math. The camera and sign guide share a two-column layout from tablet widths;
phones use a single column. All sign guidance is visible text rather than audio
alone. Supported lesson targets remain I/L/V/W/Y; Math answers remain 1–9.

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

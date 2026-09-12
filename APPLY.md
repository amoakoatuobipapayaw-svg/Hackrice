# Applying this update

Unzip so that the `src/`, `public/` and `index.html` inside `signly/` land on top
of the matching paths in your project root (the folder that contains `package.json`).

- `src/**`             — only the files that changed or are new; everything else in
                         your `src/` stays untouched.
- `public/favicon.svg` — the tab icon. Create `public/` if you don't have one.
- `index.html`         — replaces your root index.html (title, favicon link, theme colour).
                         If yours has extra tags, merge instead of replace.

## Emoji left in files I did not have

The "Take a moment to get ready" pre-start card (Lesson / Math / Speed) is not in the
source I was given, so its emoji are not fixed here. In whichever file renders it,
replace the emoji element with the shared Icon, e.g.:

    import { Icon } from "../components/ui/Icon";

    // was:  <span aria-hidden="true" className="text-5xl">✋</span>
    <span aria-hidden="true" className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand">
      <Icon name="hand" size={32} />
    </span>

Use name="hand" for Practice, "plus" for Math, "zap" for Speed.

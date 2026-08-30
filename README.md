# Ο Επισκέπτης Στις Τρεις (The Visitor at Three)

A short first-person horror game built with [Three.js](https://threejs.org/). At 3am, someone knocks on your door and asks to stay for a few days. You say yes.

No build step, no external assets — everything (rooms, characters, sound effects) is generated in code.

## Play it live

Enable **GitHub Pages** for this repo (Settings → Pages → Deploy from branch → `main` → `/ (root)`), then open:

```
https://<your-username-or-org>.github.io/<repo-name>/
```

## Controls

| Key | Action |
|---|---|
| Arrow keys | Move |
| Mouse | Look around |
| Space | Jump |
| Shift | Crouch |
| E | Interact |
| Esc | Release mouse cursor |

## Run locally

This is a static site using ES modules, so it needs to be served over HTTP (not opened directly as a `file://` URL):

```
python -m http.server 8000
```

Then open `http://localhost:8000/` in a browser.

## Story

Two days pass in the house — meals, errands, a movie — while your guest becomes stranger, and the house starts to feel wrong. On the second night, you wake to find things have gone too far, and it's up to you to end it.

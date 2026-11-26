# Echo Grove frontend

React 18 + Vite + Tone.js + Canvas 2D. Everything musical runs in the browser; the backend is optional.

## Run

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
```

To connect the backend, copy `.env.example` to `.env` and set `VITE_API_URL`.

## Pages

| Route | Page |
| --- | --- |
| `#/` | Grove: grow, play, shape and export trees |
| `#/gallery` | Featured presets and community gardens |
| `#/my-grove` | Saved gardens (needs sign-in) |
| `#/signin` | Sign in / create account |
| `#/verify?token=` | Email verification |
| `#/admin` | Gallery moderation (admins) |
| `#/g/<code>` | Opens a saved garden by its share code |

## Code map

| Folder | Role |
| --- | --- |
| `src/recursion/` | `grow()`, the recursive function, and the seeded random generator |
| `src/music/` | Seasons (scales, chords) and `compose()`, which turns the call tree into a timed score |
| `src/audio/` | Tone.js engine: live playback, subtree preview, offline WAV export, live recording |
| `src/visual/` | Canvas renderer: growing branches, call-stack glow, blossoms, breathing ring |
| `src/ui/`, `src/pages/` | React components and pages |
| `src/api/` | Backend client; without `VITE_API_URL` every call reports "not connected" |

## Keyboard

Space play/pause · R regrow · T Bloom/Trace · Z Zen · D download WAV · Esc close panels or leave Zen

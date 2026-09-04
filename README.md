# Inkling 🫧

A local-first notes app with writing streaks and a small animated buddy that lives next to the logo.

Everything is stored in your browser's `localStorage` — no account, no server, no tracking.

![stack](https://img.shields.io/badge/React-19-61dafb) ![stack](https://img.shields.io/badge/Vite-8-646cff) ![stack](https://img.shields.io/badge/TypeScript-strict-3178c6)

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
```

Other scripts: `npm run build`, `npm run preview`, `npm run typecheck`.

## Features

**Notes**
- Markdown editor with a formatting toolbar and optional live split preview
- Auto-continuing lists (`-`, `1.`, `- [ ]`) and `⌘B` / `⌘I` while typing
- Tags, six colour labels, pin, favourite
- Trash with restore / delete-forever
- Instant full-text search with match highlighting, plus four sort modes
- Autosave with a save indicator, and a distraction-free focus mode

**Streaks & progress**
- Daily writing streak with a grace period until midnight
- **Streak freezes** — you earn one every 7 days and a missed day is auto-protected
- 26-week contribution heatmap
- Daily word goal with a progress ring
- XP and levels driven by lifetime words written (Blank Page → Ink Legend)

**The buddy**
Sits next to the logo in the sidebar and is genuinely reactive:

| Mood | When |
| --- | --- |
| ✍️ writing | you're actively typing — it wiggles and scribbles |
| 🎉 celebrate | you hit the daily word goal |
| 😊 happy | you've written something today |
| 😟 worried | evening and the streak isn't safe yet |
| 💤 sleepy | 45s idle — it dozes off with zzz's |

Its eyes track your cursor, it blinks at random intervals, changes colour with its mood, and pops hearts when you click it. It also chats: goal reminders, streak nudges and keyboard tips.

**Everything else**
- Command palette (`⌘K` / `Ctrl+K`) — commands *and* jump-to-note
- Dark / light theme, six accent colours, adjustable editor font size
- JSON backup export & import, single-note `.md` export
- Shortcuts: `N` new note, `/` focus search, `Esc` close dialogs

## Project layout

```
src/
  components/   Sidebar, NoteList, Editor, Pet, Heatmap, ProgressRing,
                CommandPalette, SettingsModal
  lib/
    types.ts      Note / Settings / AppState models
    storage.ts    localStorage persistence, seeding, date + word helpers
    streak.ts     streak, freeze, heatmap and level maths
    markdown.ts   marked + DOMPurify rendering
  App.tsx       state, filtering, pet brain, shortcuts, commands
```

## Notes on data

State is one JSON blob under the `inkling.state.v1` key. Clearing site data wipes your notes, so use
**Settings → Export backup** if they matter. Markdown is sanitised with DOMPurify before rendering.

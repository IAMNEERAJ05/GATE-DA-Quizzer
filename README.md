# GATE DA Formula Quizzer

**A game-style drill app for GATE DA (Data Science & Artificial Intelligence) and General Aptitude.**
Short rounds on formulas, rules and concepts, with spaced repetition and fresh numbers every time. It works offline on a phone or a laptop.

**▶ Open the app:** https://YOUR-USERNAME.github.io/gate-da-quizzer/

> This is not a mock test. It is closer to flash cards with game mechanics: you recall a formula, spot a wrong one, pick when a result holds, or work out a quick number. Each answer is followed by the reason and the clean formula. Inspired by the *Formula Builder* game in IMS AptiBuilder.

---

## What’s inside

| Subject | Cards |
|---|---:|
| Probability & Statistics | 187 |
| Linear Algebra | 122 |
| Calculus & Optimization | 53 |
| Programming, Data Structures & Algorithms | 120 |
| Databases & Data Warehousing | 109 |
| Machine Learning | 127 |
| Artificial Intelligence | 75 |
| General Aptitude (numerical, verbal, logical, spatial) | 199 |
| **Total** | **992** |

- **Complete against the syllabus.** The official GATE DA and GA syllabus is split into 209 concept units, and every unit has at least three cards.
- **Checked against past papers.** All 210 subject questions of the IISc 2024 sample paper and the DA 2024, 2025 and 2026 papers are tagged with the units they test. So are 90 General Aptitude questions from the DA and CS papers. Every answer shows where the idea was tested, e.g. *Tested in DA 2025 Q34*.
- **Numbers that change.** 180 numeric cards draw new numbers (and new wrong options) every time, so you practise the method instead of remembering one answer.
- **Verified.** Every numeric answer was recomputed independently, code snippets were run, SQL was executed, and every formula was compiled.

## Round types

| Round | What you do |
|---|---|
| Fill the gap | Pick the missing piece of a formula |
| Spot the bug | Find the one mistake in a formula |
| When does it hold? | Pick the condition that makes a result valid |
| Concept check | One idea, four plausible answers |
| Quick solve | A short GA numeric problem with options, new numbers each time |
| Quick plug (NAT) | Type a numeric answer, like a GATE NAT question |
| Multiple select | Tick every correct option; all-or-nothing, like GATE MSQs |
| Match it | Pair four formula names with their formulas (bonus round) |
| Your note | Recall a note you added yourself, then mark whether you knew it |

You can **skip** any question (Skip button or the S key). Skipped cards come back later and are listed for review at the end of the set.

## How it helps you remember

- **5 dots per card (spaced repetition).** A correct answer on or after the card’s review date fills a dot and pushes the next review out: 1, 2, 4, 7, then 15 days. A wrong answer empties the dots. Three dots means mastered.
- **Daily set.** Tick the subjects you want; you get about 6 questions from each, with missed and due cards first.
- **Levels and points.** Each subject has a level (Learner → Capable → Advanced → Ninja) based on how much of it you have mastered. Higher levels multiply your points, and there are bonuses for speed and streaks.
- **Formula deck.** Every formula and rule of a subject on one page, with your dots.
- **Coverage.** Every syllabus unit and every tagged past-paper question, so you can see the gaps.
- **My notes.** Add your own formulas or points. They are drilled as recall cards, and you can export them as text to turn into full cards later.

## Use it on your phone (offline)

1. Open the link above once while online.
2. **Android (Chrome):** ⋮ menu → **Install app** / **Add to Home screen**.
   **iPhone (Safari):** Share → **Add to Home Screen**, and always open it from that icon.
3. That’s it. The app keeps its own copy and works without internet. New versions download in the background whenever you are online; close and reopen to see them.

On a laptop, open the same link in Chrome or Edge and click the install icon in the address bar, or simply bookmark it.

## Your data and backups

- **No account, no server, no tracking.** Progress, notes and reports are stored only in your browser on that device.
- **Download backup** (or **Share backup** on phones) saves everything as a small `.json` file.
- **Restore backup** on another device asks you to choose:
  - **Merge**: keeps progress from both devices, using the most recent answer for each card.
  - **Replace**: makes this device an exact copy of the backup.
- To move progress between laptop and phone, send the backup file to yourself (WhatsApp, Drive, email) and restore it with **Merge**.
- Download a backup every few days in case a browser clears its storage.

## Files in this repository

```
index.html             the app page (styles, script order)
manifest.webmanifest   app name, colours and icons for installing
sw.js                  service worker: stores every file for offline use
js/app.js              app logic
data/syllabus.js       syllabus → topics → concept units
data/papers.js         past-paper questions tagged with units
data/*.js              cards, one file per subject (ga.js = General Aptitude)
data/generators.js     fresh-number generators for numeric cards
vendor/                MathJax (offline maths rendering)
icons/                 app icons
```

It is plain HTML and JavaScript, with no build step and no dependencies to install. To run it locally, open `index.html` in a browser.

## Updating

Cards are edited on the laptop copy (with `AGENTS.md` and the checker `tools/validate.js`, which are not part of this repository). To publish an update, upload the changed files here (**Add file → Upload files**), keeping the same folder structure. If a new file is added, list it in `PRECACHE` in `sw.js` and change `VERSION`, so phones also cache it.

## Credits

- Maths rendering: [MathJax](https://www.mathjax.org/) (Apache License 2.0), bundled in `vendor/`.
- Fonts: IBM Plex Sans, IBM Plex Mono and Bricolage Grotesque via Google Fonts (SIL Open Font License). Without internet the app falls back to system fonts.
- Syllabus structure from the official GATE DA and GA syllabus. Past-paper questions are referenced only by paper and question number; they are not reproduced here.

*An unofficial study aid. It is not affiliated with IISc, the IITs or the GATE organising committee.*

# Video Demonstration Guide (follow this order)

Record your screen with your voice. Use OBS, Zoom (record to computer), Xbox Game Bar (Win+G), or your phone screen recorder. Export as MP4.
File name: MIDTERM_DEMO_MANGUBAT_KYLAMAY.mp4

Before recording: start the server (`node server.js`), open `http://localhost:3000`, delete `data/requests.json` if you want an empty list, then DevTools → Application → "Clear site data" and reload. Keep the usability record and `docs/architecture-diagram.png` open in another tab.

1. **Introduction (about 1–2 min)** – Say your name and the project name. Say the problem: paper forms and messages are hard to track. Say the app lets students submit requests and track them.
2. **Required features (3–5 min)** – Fill the form and submit. Show the success message and the generated ID. Submit a **second** request with the **exact same description** → show it has a different ID and both appear in the list. Change a status. Search by an ID. Filter by status. Resize the window to show the mobile layout.
3. **Architecture (3–5 min)** – Show the diagram. Open the folders: `ui/`, `services/requestService.js`, `data/dataService.js`, and `server.js`. Explain what each does, that the UI never talks to the server, and that only `dataService.js` calls the server API. Show the HOTS: change `ACTIVE_PROFILE` to `"university"`, refresh, show new status names.
4. **PWA and offline (3–5 min)** – Show `manifest.webmanifest`. In DevTools → Application show the manifest, the service worker, and the cache. Tick "Offline" and reload: app still opens with saved list and the offline banner. Try to submit → error message. Say clearly: reading is local, submitting needs the server.
5. **Usability testing (3–5 min)** – Show your completed record: the 3 tasks, times, errors, the issue found, and the improvement. Explain the HOTS answer in your own words.
6. **Challenge A (3–5 min)** – Normal submit works → stop the real server (click the terminal and press Ctrl+C) → submit → show the error and that nothing was saved → say the message is honest. (You can also show the "Simulate server failure" switch.) Start the server again with `node server.js` and submit successfully.
7. **Challenge B (3–5 min)** – Submit blank form → show messages. Enter `Juan123` and `broken` → show messages. Fix and submit successfully.
8. **Challenge C (3–5 min)** – Show the card before. Edit `requestCard.js` (change a label or style). Refresh. Show the new card. Then use the form, search, and status change to show nothing else broke. Explain why (separate modules).
9. **Technical decisions (about 2–3 min)** – Why ES modules, why status keys instead of labels, why a local cache, what you would improve (real backend, login for staff, notifications).

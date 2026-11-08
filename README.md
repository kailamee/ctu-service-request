# CTU Smart Campus Service Request System

CC316 – Applications Development and Emerging Technologies · Midterm Hands-On Practical Examination
Student: Kyla May Mangubat

A web application where students report campus problems (classroom equipment, laboratory, facility maintenance, others) and track the status of each request. Everyone who opens the app sees the same requests, because they are saved by a real Node.js server.

It is a **website that is also a Progressive Web App (PWA)**: it can be installed like an app, and its screens open even when there is no internet.

Built with plain HTML, CSS, and JavaScript (ES modules) and one Node.js server file. **No packages to install.**

## What you need
- Node.js version 18 or newer (check with `node --version`). Download from https://nodejs.org if needed.
- Chrome or Edge.

## How to run the app

1. Unzip the project.
2. Open a terminal inside the project folder.
3. Run: `node server.js` (or `npm start`)
4. Open `http://localhost:3000` in Chrome or Edge.

The terminal also prints a "same Wi-Fi" address. To stop the server, press `Ctrl + C`.

> Do not double-click `index.html` and do not use `python -m http.server`. The app needs `server.js` because that is where requests are saved.

## How other people can test it

**A. Same Wi-Fi (easiest, no sign-up)**
1. Run `node server.js` on your computer.
2. Copy the "On the same Wi-Fi" address from the terminal, for example `http://192.168.1.5:3000`.
3. Your classmate opens that address on their phone or laptop (they must use the same Wi-Fi).
4. If it does not open, allow Node.js through your computer's firewall.
Note: on this plain `http://` address the app works fully, but "install app" and offline mode only work on `localhost` or `https`.

**B. Online link (free hosting)**
Upload the project to GitHub, then create a free "Web Service" for it on a Node.js host such as Render. Use start command `node server.js`. You will get an `https://` link anyone can open, and the install and offline features will work. On free hosting, saved data may reset when the service restarts, which is fine for a demo.

**C. Temporary link from your own computer**
While `node server.js` is running, a tunnel tool such as ngrok or Cloudflare Tunnel can give you a temporary `https://` link to your computer.

Everyone who uses the same running server sees the same requests (press **Refresh list** to see new ones).

## Project structure

```
server.js                   Node.js server: serves the app + saves requests (REST API)
package.json                Lets you run it with "npm start"
index.html                  Page layout
manifest.webmanifest        PWA manifest (name, icons, colors)
sw.js                       Service worker (offline cache of the app screens)
css/styles.css              Design and responsive layout
icons/                      App icons (192 and 512 px)
data/requests.json          Saved requests (created automatically)
js/
  app.js                    Starts the app and connects the modules
  config/
    statusConfig.js         Status names (change them in ONE place)
    concernTypes.js         Concern types
  services/
    requestService.js       Validation, unique ID, status rules, search and filter
  data/
    dataService.js          Talks to the server + keeps the local cache
  ui/
    formView.js             Request form and field error messages
    listView.js             Request list, search box, status filter
    requestCard.js          One request card (Challenge C changes this file)
    messages.js             Success and error messages
    connectionBanner.js     Offline banner
    devPanel.js             "Simulate server failure" switch
docs/
  architecture-diagram.png  Architecture diagram
  Usability_Testing_Record.docx  Usability test record + HOTS answer
  VIDEO_SCRIPT.md           Guide for the video demonstration
```

## Architecture (loose coupling)

```
UI modules (js/ui/*)  <-->  requestService.js  <-->  dataService.js  <-->  server.js  <-->  data/requests.json
  what the user sees         the rules             talks to the server    REST API          saved requests
```

- The **UI** never talks to the server and never validates data.
- The **service layer** has no `document.*` code and never calls `fetch`.
- The **data layer** is the only browser file that calls the server.
- The **server** checks the data again, because it should never trust the browser.

See `docs/architecture-diagram.png`.

## Required features and where they are

| Requirement | Where |
|---|---|
| Responsive form | `index.html`, `css/styles.css` |
| Input validation | `validateRequest()` in `requestService.js` (messages shown by `formView.js`); the server checks again |
| Submit and display requests | `submitRequest()`, `listView.js` |
| Unique request ID | `generateRequestId()` – format `CTU-YYYYMMDD-XXXX` (random). It does not depend on the description, so two identical descriptions get different IDs and are saved separately. The server rejects a duplicate ID. |
| Status management | Dropdown on each request card → `changeStatus()` |
| Search / filter by status | Search box and status filter → `filterRequests()` |
| Success and error messages | `messages.js` |

## Offline and server-failure behavior

| Feature | Works offline? |
|---|---|
| Open the app screens (cached by the service worker) | Yes |
| Read the last saved list of requests (local copy) | Yes |
| Search and filter the saved list | Yes |
| Submit a new request | **No** – needs the server. Shows an error. Nothing is saved. |
| Change a request status | **No** – needs the server. Shows an error. Status stays the same. |

The app never says "success" when the server did not confirm the action. API calls are never cached by the service worker.

## Testing the challenges

**Challenge A – Server failure:** Submit a request normally. Then either stop the server (`Ctrl + C` in the terminal) or turn on "Simulate server failure" in the Demo tools box. Submit again → red error "Your request was NOT saved". The form keeps what you typed. Start the server again (or switch the demo toggle off) and submit → success.

**Challenge B – Input validation:** Click Submit with empty fields → messages appear beside each field. Type `Juan123` as the name and `broken` as the description → messages explain the problem. Fix them and submit → success.

**Challenge C – Component modification:** Open `js/ui/requestCard.js`. Change something (for example the label `"Change status"`). Save and refresh. Only the card changes. The form, validation, ID, search, and server still work because they are in other files.

**HOTS – New status names:** Open `js/config/statusConfig.js` and change `ACTIVE_PROFILE = "original"` to `"university"`. Refresh. Pending / In Progress / Resolved become Submitted / Under Review / Completed everywhere, including old requests, and no other file is edited. This works because records store a fixed key (`open`, `active`, `closed`), not the label.

**PWA / offline:** Open the app once at `http://localhost:3000` while online. In Chrome DevTools (F12) → Application → Service Workers, check it is activated. Tick "Offline" and reload. The app still opens, the saved list shows, and the offline banner appears.

> After editing app files, raise the version in `sw.js` (`ctu-requests-v2` → `v3`) or tick "Update on reload" in DevTools → Application → Service Workers, so the browser uses the new files.

## Reset the data

Stop the server, delete `data/requests.json`, start the server again. In Chrome DevTools → Application → Storage → "Clear site data" also clears the local copy.

## Known limits (prototype)
- There is no login. Anyone who can open the app can change a status. A real version would let only staff change statuses.
- Data is stored in a JSON file, which is fine for a prototype but not for thousands of users.

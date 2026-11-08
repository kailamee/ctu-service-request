// ============================================================
// DATA MANAGEMENT LAYER
// ------------------------------------------------------------
// This is the ONLY file that talks to the server and to storage.
//
//   - SERVER  : the Node.js server (server.js) through /api/...
//   - LOCAL   : a saved copy of the last list in localStorage
//               (so the list can still be read when offline)
//
// Every server call can fail when:
//   - the browser is offline,
//   - the server is stopped or not responding,
//   - the demo "Simulate server failure" switch is ON.
// Failures are thrown as a ServerError so the layers above
// can show an honest message.
// ============================================================

const API_URL = "api/requests";
const CACHE_KEY = "ctu.cache.requests";
const FAIL_KEY = "ctu.simulateServerFailure";
const TIMEOUT_MS = 6000;

export class ServerError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ServerError";
    this.code = code; // OFFLINE | SERVER_DOWN | DUPLICATE_ID | NOT_FOUND | INVALID
  }
}

/* ---------- local copy (works offline) ---------- */
function readCache() {
  try {
    const value = JSON.parse(localStorage.getItem(CACHE_KEY));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeCache(list) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(list));
  } catch {
    /* storage full or blocked: the app still works without a cache */
  }
}

export function getCached() {
  return readCache();
}

/* ---------- demo switch for Challenge A ---------- */
export function setSimulatedFailure(isOn) {
  localStorage.setItem(FAIL_KEY, isOn ? "1" : "0");
}

export function isSimulatedFailure() {
  return localStorage.getItem(FAIL_KEY) === "1";
}

/* ---------- one function that sends every server request ---------- */
async function callServer(method, url, body) {
  if (!navigator.onLine) {
    throw new ServerError("OFFLINE", "The device has no internet connection.");
  }
  if (isSimulatedFailure()) {
    throw new ServerError("SERVER_DOWN", "The data service is not responding.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      cache: "no-store",
    });
  } catch {
    // network error, server stopped, or too slow
    throw new ServerError("SERVER_DOWN", "The data service is not responding.");
  } finally {
    clearTimeout(timer);
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    /* the answer was not JSON */
  }

  if (response.ok) return payload;

  if (response.status === 409) throw new ServerError("DUPLICATE_ID", "This request ID already exists.");
  if (response.status === 404 && payload && payload.code === "NOT_FOUND") {
    throw new ServerError("NOT_FOUND", "Request not found.");
  }
  if (response.status === 400 && payload && payload.code === "INVALID") {
    throw new ServerError("INVALID", payload.error || "The server did not accept the data.");
  }
  throw new ServerError("SERVER_DOWN", "The data service is not responding.");
}

/* ---------- public data functions ---------- */

// Server-dependent: get the newest list and refresh the local copy.
export async function fetchAll() {
  const list = await callServer("GET", API_URL);
  if (!Array.isArray(list)) throw new ServerError("SERVER_DOWN", "Bad answer from the server.");
  writeCache(list);
  return list;
}

// Server-dependent: save a new request.
export async function insert(record) {
  const saved = await callServer("POST", API_URL, record);
  const cache = readCache().filter((item) => item.id !== saved.id);
  cache.push(saved);
  writeCache(cache);
  return saved;
}

// Server-dependent: change the status of one request.
export async function updateStatus(id, statusKey) {
  const updated = await callServer("PATCH", `${API_URL}/${encodeURIComponent(id)}`, { status: statusKey });
  writeCache(readCache().map((item) => (item.id === id ? updated : item)));
  return updated;
}

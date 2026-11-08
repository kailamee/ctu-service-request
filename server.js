// ============================================================
// SERVER  (Node.js, no extra packages needed)
// ------------------------------------------------------------
// 1. Serves the web app files (index.html, css, js, icons...)
// 2. Provides a small REST API that saves requests in
//    data/requests.json
//
//    GET   /api/requests        -> list all requests
//    POST  /api/requests        -> create a request
//    PATCH /api/requests/:id    -> change the status of a request
//    GET   /api/health          -> check that the server is alive
//
// Run it with:  node server.js   (then open http://localhost:3000)
// ============================================================

const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "requests.json");

// Status KEYS never change (only their labels do, in statusConfig.js)
const STATUS_KEYS = ["open", "active", "closed"];
const CONCERN_TYPES = ["Classroom Equipment", "Laboratory", "Facility Maintenance", "Others"];

/* ---------- reading and writing the data file ---------- */
function loadRequests() {
  try {
    const list = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return Array.isArray(list) ? list : [];
  } catch {
    return []; // file missing or empty -> start with an empty list
  }
}

function saveRequests(list) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const temp = DATA_FILE + ".tmp";
  fs.writeFileSync(temp, JSON.stringify(list, null, 2));
  fs.renameSync(temp, DATA_FILE); // safe save: never leaves a half-written file
}

/* ---------- small helpers ---------- */
function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let text = "";
    req.on("data", (chunk) => {
      text += chunk;
      if (text.length > 20000) { // protect the server from huge requests
        reject(new Error("TOO_BIG"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try { resolve(JSON.parse(text || "{}")); } catch { reject(new Error("BAD_JSON")); }
    });
    req.on("error", reject);
  });
}

// The browser already checks the form nicely.
// The server checks again, because it should never trust the browser.
function checkNewRequest(b) {
  const name = String(b.studentName || "").trim();
  const description = String(b.description || "").trim();
  if (!/^CTU-\d{8}-[A-Z0-9]{4}$/.test(String(b.id || ""))) return "Invalid request ID.";
  if (name.length < 3 || name.length > 100 || !/^[A-Za-zÑñ\s.'-]+$/.test(name)) return "Invalid student name.";
  if (!CONCERN_TYPES.includes(b.concernType)) return "Invalid type of concern.";
  if (description.length < 10 || description.length > 500) return "Description must be 10 to 500 characters.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(b.dateOfRequest || ""))) return "Invalid date.";
  return null;
}

/* ---------- API ---------- */
async function handleApi(req, res, pathname) {
  if (pathname === "/api/health" && req.method === "GET") {
    return sendJson(res, 200, { ok: true });
  }

  if (pathname === "/api/requests") {
    if (req.method === "GET") {
      return sendJson(res, 200, loadRequests());
    }
    if (req.method === "POST") {
      const body = await readBody(req);
      const problem = checkNewRequest(body);
      if (problem) return sendJson(res, 400, { code: "INVALID", error: problem });

      const list = loadRequests();
      if (list.some((item) => item.id === body.id)) {
        return sendJson(res, 409, { code: "DUPLICATE_ID", error: "This request ID already exists." });
      }
      const record = {
        id: body.id,
        studentName: String(body.studentName).trim(),
        concernType: body.concernType,
        description: String(body.description).trim(),
        dateOfRequest: body.dateOfRequest,
        status: "open",                       // server decides the first status
        createdAt: new Date().toISOString(),  // server decides the time
      };
      list.push(record);
      saveRequests(list);
      return sendJson(res, 201, record);
    }
    return sendJson(res, 405, { code: "METHOD", error: "Method not allowed." });
  }

  const match = pathname.match(/^\/api\/requests\/([A-Za-z0-9-]+)$/);
  if (match && req.method === "PATCH") {
    const body = await readBody(req);
    if (!STATUS_KEYS.includes(body.status)) {
      return sendJson(res, 400, { code: "INVALID", error: "Invalid status." });
    }
    const list = loadRequests();
    const target = list.find((item) => item.id === match[1]);
    if (!target) return sendJson(res, 404, { code: "NOT_FOUND", error: "Request not found." });
    target.status = body.status;
    saveRequests(list);
    return sendJson(res, 200, target);
  }

  return sendJson(res, 404, { code: "NOT_FOUND", error: "Unknown API address." });
}

/* ---------- serving the web app files ---------- */
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
};

// Only these public files can be downloaded (not server.js or the data folder).
const PUBLIC_FILE = /^\/(index\.html|sw\.js|manifest\.webmanifest)$|^\/(css|js|icons)\/[\w./-]+$/;

function serveFile(req, res, pathname) {
  let rel = pathname === "/" ? "/index.html" : pathname;
  try { rel = decodeURIComponent(rel); } catch { rel = ""; }

  const full = path.join(ROOT, rel);
  if (!PUBLIC_FILE.test(rel) || rel.includes("..") || !full.startsWith(ROOT + path.sep)) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("Not found");
  }
  fs.readFile(full, (error, content) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("Not found");
    }
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(full)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    res.end(req.method === "HEAD" ? undefined : content);
  });
}

/* ---------- the server ---------- */
const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;
  try {
    if (pathname.startsWith("/api/")) {
      return await handleApi(req, res, pathname);
    }
    if (req.method === "GET" || req.method === "HEAD") {
      return serveFile(req, res, pathname);
    }
    res.writeHead(405, { "Content-Type": "text/plain" });
    res.end("Method not allowed");
  } catch (error) {
    if (error.message === "BAD_JSON") return sendJson(res, 400, { code: "INVALID", error: "Bad data sent." });
    if (error.message === "TOO_BIG") return sendJson(res, 413, { code: "INVALID", error: "Data too big." });
    console.error(error);
    sendJson(res, 500, { code: "SERVER_ERROR", error: "Server problem." });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("\nCTU Smart Campus Service Request System is running.\n");
  console.log(`  On this computer:   http://localhost:${PORT}`);
  for (const list of Object.values(os.networkInterfaces())) {
    for (const item of list || []) {
      if (item.family === "IPv4" && !item.internal) {
        console.log(`  On the same Wi-Fi:  http://${item.address}:${PORT}`);
      }
    }
  }
  console.log("\nPress Ctrl+C to stop the server.\n");
});

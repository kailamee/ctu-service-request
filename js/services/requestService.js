// ============================================================
// APPLICATION / SERVICE LAYER  (request-processing logic)
// ------------------------------------------------------------
// Validation, unique ID creation, status rules, searching and
// filtering all live here. This file does NOT touch the page
// (no document.*) and does NOT touch storage directly.
// It talks to the data layer only through dataService functions.
// ============================================================

import * as data from "../data/dataService.js";
import { CONCERN_TYPES } from "../config/concernTypes.js";
import { DEFAULT_STATUS, isValidStatus } from "../config/statusConfig.js";

/* ---------- date helpers ---------- */
export function todayString() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

/* ---------- 1. VALIDATION ---------- */
export function validateRequest(input) {
  const errors = {};
  const name = (input.studentName || "").trim();
  const type = (input.concernType || "").trim();
  const description = (input.description || "").trim();
  const date = (input.dateOfRequest || "").trim();

  // Student name
  if (!name) {
    errors.studentName = "Please enter your name.";
  } else if (name.length < 3) {
    errors.studentName = "Your name must have at least 3 letters.";
  } else if (!/^[A-Za-zÑñ\s.'-]+$/.test(name)) {
    errors.studentName =
      "Your name can only have letters, spaces, and . ' - (no numbers).";
  }

  // Type of concern
  if (!type) {
    errors.concernType = "Please choose a type of concern.";
  } else if (!CONCERN_TYPES.includes(type)) {
    errors.concernType = "Please choose a type from the list.";
  }

  // Description
  if (!description) {
    errors.description = "Please describe your concern.";
  } else if (description.length < 10) {
    errors.description =
      "Please write at least 10 characters so we can understand the problem.";
  } else if (description.length > 500) {
    errors.description = "Please keep the description under 500 characters.";
  }

  // Date
  if (!date) {
    errors.dateOfRequest = "Please select the date of your request.";
  } else if (Number.isNaN(Date.parse(date))) {
    errors.dateOfRequest = "That date is not valid.";
  } else if (date > todayString()) {
    errors.dateOfRequest = "The date cannot be in the future.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    clean: { studentName: name, concernType: type, description, dateOfRequest: date },
  };
}

/* ---------- 2. UNIQUE REQUEST ID ---------- */
// Format: CTU-20261106-K7M2  (date + 4 random characters)
// Two requests with the same description will NEVER share an ID,
// because the ID does not depend on the description at all.
const ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing 0/O/1/I

export function generateRequestId() {
  const date = todayString().replaceAll("-", "");
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const code = Array.from(bytes, (b) => ID_CHARS[b % ID_CHARS.length]).join("");
  return `CTU-${date}-${code}`;
}

/* ---------- 3. SUBMIT ---------- */
// Always returns an object: { ok, request?, errors?, message }
export async function submitRequest(input) {
  const check = validateRequest(input);
  if (!check.valid) {
    return {
      ok: false,
      kind: "validation",
      errors: check.errors,
      message: "Please fix the highlighted fields and try again.",
    };
  }

  // Try up to 5 times in the very unlikely case of a duplicate ID.
  for (let attempt = 0; attempt < 5; attempt++) {
    const record = {
      id: generateRequestId(),
      ...check.clean,
      status: DEFAULT_STATUS,
      createdAt: new Date().toISOString(),
    };
    try {
      const saved = await data.insert(record);
      return {
        ok: true,
        request: saved,
        message: `Request submitted successfully! Your request ID is ${saved.id}.`,
      };
    } catch (error) {
      if (error.code === "DUPLICATE_ID") continue; // make a new ID
      return { ok: false, kind: "server", message: explainServerError(error, "submit") };
    }
  }
  return {
    ok: false,
    kind: "server",
    message: "We could not create a unique request ID. Your request was NOT saved. Please try again.",
  };
}

/* ---------- 4. LOAD LIST ---------- */
// Tries the server first. If that fails, falls back to the saved copy.
export async function loadRequests() {
  try {
    const requests = await data.fetchAll();
    return { requests, source: "server", warning: null };
  } catch (error) {
    return {
      requests: data.getCached(),
      source: "cache",
      warning:
        error.code === "OFFLINE"
          ? "You are offline. Showing the last saved list. It may not include the newest changes."
          : "The data service is not responding. Showing the last saved list. It may not include the newest changes.",
    };
  }
}

/* ---------- 5. CHANGE STATUS ---------- */
export async function changeStatus(id, statusKey) {
  if (!isValidStatus(statusKey)) {
    return { ok: false, message: "That status is not valid." };
  }
  try {
    const updated = await data.updateStatus(id, statusKey);
    return { ok: true, request: updated, message: `Status of ${id} was updated.` };
  } catch (error) {
    return { ok: false, message: explainServerError(error, "update") };
  }
}

/* ---------- 6. SEARCH + FILTER ---------- */
export function filterRequests(requests, { query = "", status = "all" } = {}) {
  const q = query.trim().toLowerCase();
  return requests.filter((item) => {
    const statusMatch = status === "all" || item.status === status;
    const textMatch =
      !q ||
      item.id.toLowerCase().includes(q) ||
      item.studentName.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q);
    return statusMatch && textMatch;
  });
}

/* ---------- error messages (never say "success" on failure) ---------- */
function explainServerError(error, action) {
  const doing = action === "submit" ? "submit your request" : "update the status";
  const result = action === "submit" ? "Your request was NOT saved." : "The status was NOT changed.";
  if (error.code === "OFFLINE") {
    return `You are offline, so we could not ${doing}. ${result} Please reconnect and try again.`;
  }
  if (error.code === "SERVER_DOWN") {
    return `The data service is not responding, so we could not ${doing}. ${result} Please try again later.`;
  }
  if (error.code === "NOT_FOUND") {
    return "That request could not be found. Please refresh the list.";
  }
  if (error.code === "INVALID") {
    return `The server did not accept the data: ${error.message} ${result}`;
  }
  return `Something went wrong. ${result} Please try again.`;
}

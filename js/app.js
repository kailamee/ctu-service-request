// ============================================================
// APP ENTRY POINT  (wires the modules together)
// ------------------------------------------------------------
//   UI modules  <-->  requestService  <-->  dataService
// The UI never calls dataService directly.
// ============================================================

import * as service from "./services/requestService.js";
import { initForm, showFieldErrors, clearFieldErrors, resetForm, setSubmitting } from "./ui/formView.js";
import { initListControls, readControls, renderList, setListNotice, setLoading } from "./ui/listView.js";
import { showMessage } from "./ui/messages.js";
import { initConnectionBanner } from "./ui/connectionBanner.js";
import { initDevPanel } from "./ui/devPanel.js";

let allRequests = []; // the list currently shown on screen

/* ---------- list ---------- */
function refreshView() {
  const filtered = service.filterRequests(allRequests, readControls());
  renderList(filtered, allRequests.length, handleStatusChange);
}

async function loadList({ quiet = false } = {}) {
  setLoading(true);
  const result = await service.loadRequests();
  allRequests = result.requests;
  setListNotice(result.warning);
  refreshView();
  setLoading(false);
  if (!quiet && result.source === "server") {
    showMessage("info", "The request list is up to date.");
  }
}

/* ---------- submit ---------- */
async function handleSubmit(formData) {
  clearFieldErrors();
  setSubmitting(true);
  const result = await service.submitRequest(formData);
  setSubmitting(false);

  if (result.ok) {
    resetForm();
    showMessage("success", result.message, { copyText: result.request.id });
    await loadList({ quiet: true });
  } else if (result.kind === "validation") {
    showFieldErrors(result.errors);
    showMessage("error", result.message);
  } else {
    // Server / offline problem: keep what the student typed.
    showMessage("error", result.message);
  }
}

/* ---------- change status ---------- */
async function handleStatusChange(id, statusKey) {
  const result = await service.changeStatus(id, statusKey);
  if (result.ok) {
    showMessage("success", result.message);
    await loadList({ quiet: true });
  } else {
    showMessage("error", result.message);
    refreshView(); // put the dropdown back to the real (old) status
  }
}

/* ---------- start ---------- */
function start() {
  initConnectionBanner();
  initDevPanel();
  initForm(handleSubmit);
  initListControls({ onChange: refreshView, onRefresh: () => loadList() });
  loadList({ quiet: true });

  // PWA: register the service worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch((err) => {
      console.warn("Service worker not registered:", err);
    });
  }
  setupInstallButton();

  // When the student comes back to this tab, get the newest list
  // (other people may have submitted requests meanwhile).
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") loadList({ quiet: true });
  });
}

/* ---------- optional "Install app" button ---------- */
function setupInstallButton() {
  const button = document.getElementById("install-btn");
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    button.hidden = false;
  });
  button.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    button.hidden = true;
  });
}

start();

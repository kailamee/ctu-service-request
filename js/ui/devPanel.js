// UI module: small "demo tools" box used for Challenge A.
// It switches the simulated server failure on and off.

import { isSimulatedFailure, setSimulatedFailure } from "../data/dataService.js";

export function initDevPanel() {
  const toggle = document.getElementById("fail-toggle");
  const label = document.getElementById("fail-state");
  toggle.checked = isSimulatedFailure();

  function show() {
    label.textContent = toggle.checked ? "Server is DOWN (simulated)" : "Server is working";
    label.className = toggle.checked ? "state-down" : "state-up";
  }

  toggle.addEventListener("change", () => {
    setSimulatedFailure(toggle.checked);
    show();
  });
  show();
}

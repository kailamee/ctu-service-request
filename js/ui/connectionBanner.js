// UI module: shows a banner when the device is offline,
// and tells the user which features still work.

export function initConnectionBanner() {
  const banner = document.getElementById("offline-banner");

  function update() {
    banner.hidden = navigator.onLine;
  }

  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  update();
}

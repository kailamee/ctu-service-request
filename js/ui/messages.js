// UI module: success / error / info messages (toast area at the top).
// Uses textContent only, so user text can never inject HTML.

const area = () => document.getElementById("message-area");

export function showMessage(type, text, options = {}) {
  const box = area();
  box.replaceChildren();

  const note = document.createElement("div");
  note.className = `message message-${type}`; // success | error | info | warning
  note.setAttribute("role", type === "error" ? "alert" : "status");

  const p = document.createElement("p");
  p.textContent = text;
  note.append(p);

  // Optional "Copy ID" button (helps users keep their request ID)
  if (options.copyText) {
    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "btn btn-small";
    copy.textContent = "Copy ID";
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(options.copyText);
        copy.textContent = "Copied!";
      } catch {
        copy.textContent = "Press Ctrl+C to copy";
      }
    });
    note.append(copy);
  }

  const close = document.createElement("button");
  close.type = "button";
  close.className = "message-close";
  close.setAttribute("aria-label", "Close message");
  close.textContent = "×";
  close.addEventListener("click", () => note.remove());
  note.append(close);

  box.append(note);
  note.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

export function clearMessage() {
  area().replaceChildren();
}

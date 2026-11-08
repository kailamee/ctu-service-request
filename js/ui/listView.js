// UI module: the list of requests + search and filter controls.

import { getStatuses } from "../config/statusConfig.js";
import { createRequestCard } from "./requestCard.js";

const $ = (id) => document.getElementById(id);

export function initListControls({ onChange, onRefresh }) {
  const filter = $("status-filter");
  const all = document.createElement("option");
  all.value = "all";
  all.textContent = "All statuses";
  filter.append(all);
  for (const status of getStatuses()) {
    const option = document.createElement("option");
    option.value = status.key;
    option.textContent = status.label;
    filter.append(option);
  }

  $("search-input").addEventListener("input", onChange);
  filter.addEventListener("change", onChange);
  $("refresh-btn").addEventListener("click", onRefresh);
  $("clear-btn").addEventListener("click", () => {
    $("search-input").value = "";
    filter.value = "all";
    onChange();
  });
}

export function readControls() {
  return { query: $("search-input").value, status: $("status-filter").value };
}

export function renderList(requests, totalCount, onStatusChange) {
  const list = $("request-list");
  list.replaceChildren();

  const statuses = getStatuses();
  // Newest first
  const sorted = [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  for (const request of sorted) {
    list.append(createRequestCard(request, statuses, onStatusChange));
  }

  $("result-count").textContent = `Showing ${requests.length} of ${totalCount} request${totalCount === 1 ? "" : "s"}`;

  const empty = $("empty-state");
  if (totalCount === 0) {
    empty.textContent = "No requests yet. Fill in the form to submit the first one.";
    empty.hidden = false;
  } else if (requests.length === 0) {
    empty.textContent = "No requests match your search. Try a different ID or status.";
    empty.hidden = false;
  } else {
    empty.hidden = true;
  }
}

export function setListNotice(text) {
  const notice = $("list-notice");
  notice.textContent = text || "";
  notice.hidden = !text;
}

export function setLoading(isLoading) {
  $("refresh-btn").disabled = isLoading;
  $("refresh-btn").textContent = isLoading ? "Loading…" : "Refresh list";
}

// UI component: ONE request card.
// Challenge C idea: change the look, label or layout of the card
// here. Nothing else in the app has to change.

import { getStatusLabel } from "../config/statusConfig.js";

export function createRequestCard(request, statuses, onStatusChange) {
  const card = document.createElement("li");
  card.className = "request-card";
  card.dataset.id = request.id;

  /* top row: ID + status badge */
  const top = document.createElement("div");
  top.className = "card-top";

  const id = document.createElement("span");
  id.className = "request-id";
  id.textContent = request.id;

  const badge = document.createElement("span");
  badge.className = `badge badge-${request.status}`;
  badge.textContent = getStatusLabel(request.status);

  top.append(id, badge);

  /* body */
  const title = document.createElement("h3");
  title.textContent = request.concernType;

  const meta = document.createElement("p");
  meta.className = "card-meta";
  meta.textContent = `${request.studentName} · ${request.dateOfRequest}`;

  const description = document.createElement("p");
  description.className = "card-description";
  description.textContent = request.description;

  /* status changer */
  const row = document.createElement("div");
  row.className = "card-status-row";

  const label = document.createElement("label");
  label.textContent = "Change status";
  const selectId = `status-${request.id}`;
  label.htmlFor = selectId;

  const select = document.createElement("select");
  select.id = selectId;
  for (const status of statuses) {
    const option = document.createElement("option");
    option.value = status.key;
    option.textContent = status.label;
    option.selected = status.key === request.status;
    select.append(option);
  }
  select.addEventListener("change", () => onStatusChange(request.id, select.value));

  row.append(label, select);
  card.append(top, title, meta, description, row);
  return card;
}

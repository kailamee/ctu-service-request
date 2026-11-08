// UI module: the service request form.
// It only reads the form and shows errors. It does NOT validate
// (validation belongs to the service layer).

import { CONCERN_TYPES } from "../config/concernTypes.js";
import { todayString } from "../services/requestService.js";

const FIELDS = ["studentName", "concernType", "description", "dateOfRequest"];
const $ = (id) => document.getElementById(id);

export function initForm(onSubmit) {
  const select = $("concernType");
  for (const type of CONCERN_TYPES) {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    select.append(option);
  }

  $("dateOfRequest").value = todayString();
  $("dateOfRequest").max = todayString();

  const description = $("description");
  description.addEventListener("input", updateCounter);
  updateCounter();

  $("request-form").addEventListener("submit", (event) => {
    event.preventDefault();
    onSubmit(readForm());
  });
}

function updateCounter() {
  $("description-count").textContent = `${$("description").value.length} / 500`;
}

export function readForm() {
  return {
    studentName: $("studentName").value,
    concernType: $("concernType").value,
    description: $("description").value,
    dateOfRequest: $("dateOfRequest").value,
  };
}

export function showFieldErrors(errors) {
  clearFieldErrors();
  let firstBad = null;
  for (const field of FIELDS) {
    if (errors[field]) {
      $(`${field}-error`).textContent = errors[field];
      $(field).setAttribute("aria-invalid", "true");
      $(field).closest(".field").classList.add("has-error");
      firstBad = firstBad || $(field);
    }
  }
  if (firstBad) firstBad.focus();
}

export function clearFieldErrors() {
  for (const field of FIELDS) {
    $(`${field}-error`).textContent = "";
    $(field).removeAttribute("aria-invalid");
    $(field).closest(".field").classList.remove("has-error");
  }
}

export function resetForm() {
  $("request-form").reset();
  $("dateOfRequest").value = todayString();
  clearFieldErrors();
  updateCounter();
}

export function setSubmitting(isBusy) {
  const button = $("submit-btn");
  button.disabled = isBusy;
  button.textContent = isBusy ? "Submitting…" : "Submit request";
}

// ============================================================
// STATUS CONFIGURATION  (the ONLY file that knows status names)
// ------------------------------------------------------------
// Each status has a fixed internal KEY ("open", "active", "closed").
// Records saved in storage use the KEY, never the label.
// So changing the label here (Pending -> Submitted) updates
// the whole app without touching any other module.
//
// HOTS challenge: to switch to the new university statuses,
// change ACTIVE_PROFILE below from "original" to "university".
// ============================================================

const PROFILES = {
  original: {
    open: "Pending",
    active: "In Progress",
    closed: "Resolved",
  },
  university: {
    open: "Submitted",
    active: "Under Review",
    closed: "Completed",
  },
};

export const ACTIVE_PROFILE = "original"; // <-- change to "university"

export const STATUS_ORDER = ["open", "active", "closed"];
export const DEFAULT_STATUS = "open";

export function getStatuses() {
  return STATUS_ORDER.map((key) => ({
    key,
    label: PROFILES[ACTIVE_PROFILE][key],
  }));
}

export function getStatusLabel(key) {
  return PROFILES[ACTIVE_PROFILE][key] || key;
}

export function isValidStatus(key) {
  return STATUS_ORDER.includes(key);
}

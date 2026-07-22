// Access control — the "C+A" model.
//
//   C (corporate)     : only verified employee-domain emails may sign in.
//   A (authorization) : which apps a signed-in user may see (added later, e.g.
//                       from Entra groups). For now everyone who passes C sees
//                       the full catalog; `isOwner` is the hook for all-access +
//                       management (CEO / IT admin / dev).
//
// Keep this provider-agnostic and pure so it stays unit-testable.

export const employeeDomains = (process.env.EMPLOYEE_DOMAINS ?? "")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

/** C — is this email allowed to sign in to the portal at all? */
export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const domain = email.toLowerCase().split("@")[1];
  if (!domain) return false;
  // If no domains are configured, fail closed rather than open.
  return employeeDomains.length > 0 && employeeDomains.includes(domain);
}

export const ownerEmails = (process.env.OWNER_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/** Owner — sees every app regardless of group access, and can manage the catalog. */
export function isOwner(email: string | null | undefined): boolean {
  if (!email) return false;
  return ownerEmails.includes(email.toLowerCase());
}

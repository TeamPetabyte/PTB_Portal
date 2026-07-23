// Access control — the "C+A" model.
//
//   C (corporate)     : only verified employee-domain emails may sign in.
//   A (authorization) : which apps a signed-in user may see (added later, e.g.
//                       from Entra groups). For now everyone who passes C sees
//                       the full catalog; `isOwner` is the hook for all-access +
//                       management (CEO / IT admin / dev).
//
// Keep this provider-agnostic and pure so it stays unit-testable. Env is read
// at call time (not module load) so the checks always reflect current config
// and tests can vary it.

function parseList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** Employee domains allowed to sign in (the "C" allowlist). */
export function employeeDomains(): string[] {
  return parseList(process.env.EMPLOYEE_DOMAINS);
}

/** Owner emails — all-access + catalog management. */
export function ownerEmails(): string[] {
  return parseList(process.env.OWNER_EMAILS);
}

/** C — is this email allowed to sign in to the portal at all? */
export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const domain = email.toLowerCase().split("@")[1];
  if (!domain) return false;
  const domains = employeeDomains();
  // If no domains are configured, fail closed rather than open.
  return domains.length > 0 && domains.includes(domain);
}

/** Owner — sees every app regardless of group access, and can manage the catalog. */
export function isOwner(email: string | null | undefined): boolean {
  if (!email) return false;
  return ownerEmails().includes(email.toLowerCase());
}

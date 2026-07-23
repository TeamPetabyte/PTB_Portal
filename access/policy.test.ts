import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { isAllowedEmail, isOwner, employeeDomains, ownerEmails } from "./policy.ts";

beforeEach(() => {
  delete process.env.EMPLOYEE_DOMAINS;
  delete process.env.OWNER_EMAILS;
});

test("isAllowedEmail: accepts a configured employee domain", () => {
  process.env.EMPLOYEE_DOMAINS = "petabyte.co.th";
  assert.equal(isAllowedEmail("winn@petabyte.co.th"), true);
});

test("isAllowedEmail: is case-insensitive on email and domain", () => {
  process.env.EMPLOYEE_DOMAINS = "Petabyte.CO.TH";
  assert.equal(isAllowedEmail("WINN@Petabyte.co.TH"), true);
});

test("isAllowedEmail: rejects a non-employee domain", () => {
  process.env.EMPLOYEE_DOMAINS = "petabyte.co.th";
  assert.equal(isAllowedEmail("someone@gmail.com"), false);
});

test("isAllowedEmail: requires an exact domain (no subdomain match)", () => {
  process.env.EMPLOYEE_DOMAINS = "petabyte.co.th";
  assert.equal(isAllowedEmail("user@evil.petabyte.co.th"), false);
});

test("isAllowedEmail: fails closed when no domains are configured", () => {
  // EMPLOYEE_DOMAINS unset — must not let anyone in.
  assert.equal(isAllowedEmail("winn@petabyte.co.th"), false);
});

test("isAllowedEmail: handles empty / malformed input", () => {
  process.env.EMPLOYEE_DOMAINS = "petabyte.co.th";
  assert.equal(isAllowedEmail(null), false);
  assert.equal(isAllowedEmail(undefined), false);
  assert.equal(isAllowedEmail(""), false);
  assert.equal(isAllowedEmail("not-an-email"), false);
});

test("isAllowedEmail: supports multiple comma-separated domains with spaces", () => {
  process.env.EMPLOYEE_DOMAINS = "petabyte.co.th, partner.com";
  assert.equal(isAllowedEmail("a@petabyte.co.th"), true);
  assert.equal(isAllowedEmail("b@partner.com"), true);
  assert.equal(isAllowedEmail("c@other.com"), false);
});

test("isOwner: matches a configured owner email case-insensitively", () => {
  process.env.OWNER_EMAILS = "boss@petabyte.co.th";
  assert.equal(isOwner("BOSS@petabyte.co.th"), true);
  assert.equal(isOwner("staff@petabyte.co.th"), false);
});

test("isOwner: is false when no owners configured or email missing", () => {
  assert.equal(isOwner("boss@petabyte.co.th"), false);
  process.env.OWNER_EMAILS = "boss@petabyte.co.th";
  assert.equal(isOwner(null), false);
  assert.equal(isOwner(undefined), false);
});

test("parsers trim, lowercase, and drop empty entries", () => {
  process.env.EMPLOYEE_DOMAINS = " A.com , ,B.COM ";
  assert.deepEqual(employeeDomains(), ["a.com", "b.com"]);
  process.env.OWNER_EMAILS = "";
  assert.deepEqual(ownerEmails(), []);
});

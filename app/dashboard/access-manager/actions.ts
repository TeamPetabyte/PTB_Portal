"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { isOwner } from "@/access/policy";
import { prisma } from "@/db";

async function requireOwner() {
  const session = await auth();
  if (!isOwner(session?.user?.email)) {
    throw new Error("Not authorized.");
  }
}

// Logo arrives as a data URI from the client-side file reader (or stays "").
// Only image data URIs / http(s) URLs are stored; anything else becomes null.
const MAX_LOGO_CHARS = 400_000; // ~300KB of base64 image data

function readLogo(formData: FormData): string | null {
  const raw = String(formData.get("logo") ?? "").trim();
  if (!raw || raw.length > MAX_LOGO_CHARS) return null;
  if (!raw.startsWith("data:image/") && !/^https?:\/\//.test(raw)) return null;
  return raw;
}

function readAppFields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    // Category picker is hidden while the taxonomy is undecided; keep the
    // column populated with a default so it can come back without a migration.
    category: String(formData.get("category") ?? "").trim() || "data",
    logo: readLogo(formData),
    url: String(formData.get("url") ?? "").trim(),
    openInNewTab: formData.get("openInNewTab") === "on",
    // authType stays "sso" for every app — internal-only for now. The icon
    // picker is gone too: logos cover recognition, `icon` only remains as
    // the card fallback (existing rows keep theirs, new rows get "grid").
  };
}

function revalidateCatalog() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/access-manager");
}

export async function createApp(formData: FormData) {
  await requireOwner();
  const fields = readAppFields(formData);

  const last = await prisma.app.findFirst({ orderBy: { sortOrder: "desc" } });
  await prisma.app.create({
    data: { ...fields, icon: "grid", sortOrder: (last?.sortOrder ?? 0) + 1 },
  });

  revalidateCatalog();
}

export async function updateApp(id: string, formData: FormData) {
  await requireOwner();
  const fields = readAppFields(formData);

  await prisma.app.update({ where: { id }, data: fields });

  revalidateCatalog();
}

export async function setAppActive(id: string, active: boolean) {
  await requireOwner();

  await prisma.app.update({ where: { id }, data: { active } });

  revalidateCatalog();
}

export async function deleteApp(id: string) {
  await requireOwner();

  // AppAccess rows go with it (onDelete: Cascade in the schema).
  await prisma.app.delete({ where: { id } });

  revalidateCatalog();
}

export async function createAnnouncement(formData: FormData) {
  await requireOwner();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return;

  await prisma.announcement.create({ data: { title, body } });

  revalidateCatalog();
}

export async function updateAnnouncement(id: string, formData: FormData) {
  await requireOwner();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return;

  await prisma.announcement.update({ where: { id }, data: { title, body } });

  revalidateCatalog();
}

export async function deleteAnnouncement(id: string) {
  await requireOwner();

  await prisma.announcement.delete({ where: { id } });

  revalidateCatalog();
}

export async function moveApp(id: string, direction: "up" | "down") {
  await requireOwner();

  const apps = await prisma.app.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });
  const from = apps.findIndex((a) => a.id === id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from < 0 || to < 0 || to >= apps.length) return;

  const order = [...apps];
  [order[from], order[to]] = [order[to], order[from]];

  // Reindex the whole list so duplicate/legacy sortOrder values self-heal.
  await prisma.$transaction(
    order.map((a, idx) =>
      prisma.app.update({ where: { id: a.id }, data: { sortOrder: idx + 1 } }),
    ),
  );

  revalidateCatalog();
}

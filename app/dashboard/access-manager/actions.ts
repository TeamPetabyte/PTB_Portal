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

function readAppFields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    icon: String(formData.get("icon") ?? "").trim(),
    url: String(formData.get("url") ?? "").trim(),
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
    data: { ...fields, sortOrder: (last?.sortOrder ?? 0) + 1 },
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

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isOwner } from "@/access/policy";
import { prisma } from "@/db";
import AccessManagerClient from "@/components/AccessManagerClient";

export default async function Page() {
  const session = await auth();
  if (!session?.user) redirect("/");
  if (!isOwner(session.user.email)) redirect("/dashboard");

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [apps, annRows, openRows] = await Promise.all([
    prisma.app.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.announcement.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.appOpenEvent.groupBy({
      by: ["appId"],
      _count: { appId: true },
      where: { openedAt: { gte: since } },
    }),
  ]);

  const opens: Record<string, number> = {};
  for (const row of openRows) opens[row.appId] = row._count.appId;

  const announcements = annRows.map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    createdAt: a.createdAt.toISOString(),
  }));

  return <AccessManagerClient apps={apps} opens={opens} announcements={announcements} />;
}

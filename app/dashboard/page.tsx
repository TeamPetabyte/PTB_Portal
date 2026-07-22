import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isOwner } from "@/access/policy";
import { prisma } from "@/db";
import PortalApp, { type PortalUser } from "@/components/PortalApp";
import type { App, CatKey } from "@/components/portal-data";

export default async function Page() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const name = session.user.name ?? session.user.email ?? "User";
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const user: PortalUser = {
    name,
    email: session.user.email ?? "",
    initials: initials || "U",
  };

  const rows = await prisma.app.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
  const apps: App[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    cat: row.category as CatKey,
    icon: row.icon,
    desc: row.description,
    url: row.url,
    openInNewTab: row.openInNewTab,
  }));

  return <PortalApp user={user} apps={apps} isOwner={isOwner(session.user.email)} />;
}

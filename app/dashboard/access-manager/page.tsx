import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isOwner } from "@/access/policy";
import { prisma } from "@/db";
import AccessManagerClient from "@/components/AccessManagerClient";

export default async function Page() {
  const session = await auth();
  if (!session?.user) redirect("/");
  if (!isOwner(session.user.email)) redirect("/dashboard");

  const apps = await prisma.app.findMany({ orderBy: { sortOrder: "asc" } });

  return <AccessManagerClient apps={apps} />;
}

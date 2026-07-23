"use server";

import { auth } from "@/auth";
import { prisma } from "@/db";

/**
 * Record an app launch for usage insight (any signed-in employee).
 * Fire-and-forget from the client — never throws back to the UI.
 */
export async function logAppOpen(appId: string) {
  try {
    const session = await auth();
    const email = session?.user?.email;
    if (!email || typeof appId !== "string" || !appId) return;

    await prisma.appOpenEvent.create({
      data: { appId, userEmail: email.toLowerCase() },
    });
  } catch {
    // Usage logging must never break opening an app (bad id, DB hiccup…).
  }
}

import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { isAllowedEmail } from "@/access/policy";

/**
 * NextAuth (Auth.js v5) configuration for Petabyte Portal.
 *
 * Sign-in is delegated to Microsoft Entra ID; the portal never sees passwords.
 * The `signIn` callback enforces the "C" rule (employee domain only).
 * Credentials come from .env.local (MS_TENANT_ID / MS_CLIENT_ID / MS_CLIENT_SECRET).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    MicrosoftEntraID({
      clientId: process.env.MS_CLIENT_ID,
      clientSecret: process.env.MS_CLIENT_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}/v2.0`,
      // Always show the Microsoft account picker instead of silently reusing the
      // existing SSO session — lets you switch/test different accounts.
      authorization: { params: { prompt: "select_account" } },
    }),
  ],
  pages: {
    signIn: "/",
  },
  callbacks: {
    // C — only verified @petabyte.co.th accounts may sign in.
    signIn({ profile }) {
      const email = (profile?.email ?? profile?.preferred_username) as string | undefined;
      return isAllowedEmail(email);
    },
    // Persist a reliable email/name onto the token (Entra sometimes only fills
    // preferred_username rather than email).
    jwt({ token, profile }) {
      if (profile) {
        token.email = (profile.email ?? profile.preferred_username ?? token.email) as string;
        token.name = (profile.name ?? token.name) as string;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.email) session.user.email = token.email;
        if (token.name) session.user.name = token.name;
      }
      return session;
    },
  },
});

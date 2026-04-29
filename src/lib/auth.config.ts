// Configuration partagée Edge-safe (utilisée par le middleware).
// Aucun import nodejs (pas de Prisma, pas de bcrypt) ici.

import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [], // les vrais providers sont définis dans auth.ts (côté Node)
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = (user as { id?: string }).id ?? token.sub ?? "";
        token.verified = (user as { verified?: boolean }).verified ?? false;
        token.role =
          (user as { role?: "USER" | "ADMIN" | "MODERATOR" }).role ?? "USER";
        token.banned = (user as { banned?: boolean }).banned ?? false;
      }
      // Refresh : auth.ts surcharge ce callback pour relire la BDD au "update"
      if (trigger === "update" && token.id) {
        token.__needsRefresh = true;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.verified = (token.verified as boolean) ?? false;
        session.user.role =
          (token.role as "USER" | "ADMIN" | "MODERATOR") ?? "USER";
        session.user.banned = (token.banned as boolean) ?? false;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

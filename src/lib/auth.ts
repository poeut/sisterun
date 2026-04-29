import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { loginSchema } from "./validators";
import { authConfig } from "./auth.config";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      verified: boolean;
      role: "USER" | "ADMIN" | "MODERATOR";
      banned: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    verified?: boolean;
    role?: "USER" | "ADMIN" | "MODERATOR";
    banned?: boolean;
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(rawCreds) {
        const parsed = loginSchema.safeParse(rawCreds);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        if (user.banned) {
          throw new Error("Votre compte a été banni.");
        }
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          image: user.photoUrl ?? undefined,
          verified: user.verified,
          role: user.role,
          banned: user.banned,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // Surcharge pour relire la BDD côté Node lorsqu'un update est demandé
    async jwt(params) {
      const base = (await authConfig.callbacks!.jwt!(params)) as Record<
        string,
        unknown
      > | null;
      if (base && base.__needsRefresh && typeof base.id === "string") {
        const fresh = await prisma.user.findUnique({ where: { id: base.id } });
        if (fresh) {
          base.verified = fresh.verified;
          base.role = fresh.role;
          base.banned = fresh.banned;
        }
        delete base.__needsRefresh;
      }
      return base;
    },
  },
});

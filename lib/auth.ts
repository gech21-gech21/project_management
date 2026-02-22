import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID || "",
      clientSecret: env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email and password required");
          }

          const { email, password } = credentials;

          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email },
          });

          // Check if user exists and has password
          if (!user || !user.passwordHash) {
            throw new Error("Invalid email or password");
          }

          // Check if email is verified (optional - remove if you don't require verification)
          if (!user.emailVerified) {
            throw new Error("Please verify your email before logging in");
          }

          // Check if user is active
          if (user.status !== "ACTIVE") {
            throw new Error(
              "Your account has been deactivated. Please contact support.",
            );
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(
            password,
            user.passwordHash,
          );
          if (!isPasswordValid) {
            throw new Error("Invalid email or password");
          }

          // Update last login timestamp
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.fullName,
            image: user.avatarUrl || null,
            role: user.role,
            status: user.status,
          };
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : String(error);
          throw new Error(message || "Authentication failed");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        if (typeof user.role === "string") token.role = user.role;
        if (typeof user.status === "string") token.status = user.status;
        token.name = (user.name as string) ?? token.name;
        token.email = (user.email as string) ?? token.email;
        token.picture = (user.image as string) ?? token.picture;
        token.lastUpdated = Date.now();
      }

      // Handle session updates (e.g., after profile update)
      if (trigger === "update" && session) {
        token.name = session.name;
        token.role = session.role;
        token.picture = session.avatarUrl;
        token.lastUpdated = Date.now();
      }

      // Refresh user data periodically (every 5 minutes)
      const lastUpdated =
        typeof token.lastUpdated === "number" ? token.lastUpdated : 0;
      const shouldRefresh = Date.now() - lastUpdated > 5 * 60 * 1000;

      if (shouldRefresh) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
            select: {
              id: true,
              role: true,
              status: true,
              fullName: true,
              avatarUrl: true,
            },
          });

          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.status = dbUser.status;
            token.name = dbUser.fullName;
            token.picture = dbUser.avatarUrl;
            token.lastUpdated = Date.now();
          }
        } catch (error) {
          console.error("Error refreshing user data in JWT callback:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.status = token.status as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string | null;

        // Add isAdmin helper
        session.user.isAdmin = token.role === "ADMIN";
        session.user.isProjectManager = token.role === "PROJECT_MANAGER";
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Handle OAuth sign in
      if (account?.provider === "google") {
        try {
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          if (existingUser) {
            // Update last login for existing user
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                lastLoginAt: new Date(),
                avatarUrl: user.image || existingUser.avatarUrl,
              },
            });
            return true;
          }

          // Create new user from Google profile
          await prisma.user.create({
            data: {
              email: user.email!,
              fullName: user.name!,
              avatarUrl: user.image ?? null,
              role: "MEMBER",
              status: "ACTIVE",
              emailVerified: new Date(), // Google accounts are pre-verified
              // passwordHash is required by the Prisma schema; OAuth users don't have one.
              passwordHash: "",
            },
          });
          return true;
        } catch (error) {
          console.error("Error in Google sign in:", error);
          return false;
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/auth",
    error: "/auth",
    verifyRequest: "/auth?tab=verify",
    newUser: "/dashboard",
  },
  events: {
    async signIn({ user }) {
      console.log(`User signed in: ${user.email}`);
    },
    async signOut({ session }) {
      console.log("User signed out");
    },
  },
  secret: env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

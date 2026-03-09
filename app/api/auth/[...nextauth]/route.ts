import NextAuth, {
  type AuthOptions,
  type User as NextAuthUser,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Extend the built-in User type
interface ExtendedUser extends NextAuthUser {
  role: string;
  username: string;
}

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        if (!user.emailVerified) {
          throw new Error("Please verify your email before logging in");
        }

        const valid = await bcrypt.compare(credentials.password, user.password);

        if (!valid) {
          throw new Error("Invalid credentials");
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Return as ExtendedUser
        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          image: user.avatarUrl,
          role: user.role,
          username: user.username,
        } as ExtendedUser;
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const extendedUser = user as ExtendedUser;
        token.id = extendedUser.id;
        token.role = extendedUser.role;
        token.username = extendedUser.username;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        (session.user as { username?: string }).username =
          token.username as string;
      }
      return session;
    },

    async signIn({ user, account, profile }) {
      // Always allow credentials sign in
      if (account?.provider === "credentials") {
        return true;
      }

      // Handle Google sign in
      if (account?.provider === "google") {
        try {
          if (!user.email) {
            return false;
          }

          // Check if user exists with this email
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { accounts: true },
          });

          // Case 1: New user - create account
          if (!existingUser) {
            // Create new user with Google data
            const newUser = await prisma.user.create({
              data: {
                email: user.email,
                fullName: user.name || "",
                username: user.email?.split('@')[0] || "", // Generate username from email
                avatarUrl: user.image,
                emailVerified: new Date(), // Google emails are verified
                role: "USER",
                accounts: {
                  create: {
                    type: account.type,
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                    access_token: account.access_token,
                    expires_at: account.expires_at,
                    token_type: account.token_type,
                    scope: account.scope,
                    id_token: account.id_token,
                    session_state: account.session_state,
                  }
                }
              }
            });
            return true;
          }

          // Case 2: Existing user with no accounts (created via credentials)
          if (existingUser.accounts.length === 0) {
            // Link Google account to existing user
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
              }
            });

            // Update user with Google info if not already set
            if (!existingUser.avatarUrl && user.image) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: { avatarUrl: user.image }
              });
            }

            return true;
          }

          // Case 3: Check if this Google account is already linked
          const existingAccount = existingUser.accounts.find(
            acc => acc.provider === account.provider && 
                   acc.providerAccountId === account.providerAccountId
          );

          if (existingAccount) {
            return true; // Account already linked - allow sign in
          }

          // Case 4: User exists with different provider
          // This is where OAuthAccountNotLinked would occur
          // You have two options:

          // OPTION 1: Automatically link the new Google account (Recommended)
          await prisma.account.create({
            data: {
              userId: existingUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state,
            }
          });
          return true;

          // OPTION 2: Return false to show error (uncomment below and comment OPTION 1)
          // return false;

        } catch (error) {
          console.error("Error in Google signIn callback:", error);
          return false;
        }
      }

      return true;
    },
  },

  pages: {
    signIn: "/auth",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/auth/new-user",
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
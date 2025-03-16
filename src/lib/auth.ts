import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'staff';
  }

  interface Session {
    user: User;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.staff.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        // For now, we'll return the user without password check
        // In production, you should implement proper password verification
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.isAdmin ? 'admin' : 'staff',
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = token.role as 'admin' | 'staff';
      }
      return session;
    },
  },
}; 
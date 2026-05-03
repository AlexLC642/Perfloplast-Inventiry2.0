import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const ADMIN_EMAIL = 'admin@perfloplast.com';
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'perfloplast123';

        if (credentials?.email === ADMIN_EMAIL && credentials?.password === ADMIN_PASSWORD) {
          return {
            id: 'admin-id',
            name: 'Administrador',
            email: ADMIN_EMAIL,
            role: 'ADMIN',
          };
        }

        throw new Error('Credenciales inválidas');
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

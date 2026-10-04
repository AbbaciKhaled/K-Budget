import type { NextAuthConfig } from "next-auth";

const AUTH_PAGES = ["/login", "/signup"];

/** Edge-safe config shared by the proxy and the full Auth.js instance (no DB imports here). */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const isAuthPage = AUTH_PAGES.some((p) => nextUrl.pathname.startsWith(p));
      if (isAuthPage) {
        return isLoggedIn ? Response.redirect(new URL("/", nextUrl)) : true;
      }
      // Returning false redirects to `pages.signIn` with a callbackUrl.
      return isLoggedIn;
    },
    session({ session, token }) {
      if (token.sub && session.user) session.user.id = token.sub;
      return session;
    },
  },
} satisfies NextAuthConfig;

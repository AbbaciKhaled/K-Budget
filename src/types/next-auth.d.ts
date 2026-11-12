import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    /** Bumped when the password changes, to invalidate existing sessions. */
    sessionVersion?: number;
  }
  interface Session {
    sessionVersion?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sv?: number;
  }
}

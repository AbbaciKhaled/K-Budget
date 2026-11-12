import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { connectDB } from "@/lib/db";
import { loginSchema } from "@/lib/validation/auth";
import { User } from "@/models/User";
import { clearAttempts, clientIp, isRateLimited, LIMITS, recordAttempt } from "@/server/rateLimit";

let dummyHash: string | undefined;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  logger: {
    // A wrong password is an expected outcome, not a server error.
    error(error) {
      if (error.name === "CredentialsSignin") return;
      console.error(error);
    },
  },
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "Username or email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { identifier, password } = parsed.data;

        // Brute-force protection, enforced here so it also covers direct calls to the auth endpoint.
        const ip = clientIp(request.headers);
        const accountKey = `login:account:${identifier}`;
        const ipKey = ip === "unknown" ? null : `login:ip:${ip}`;
        if (
          (await isRateLimited(accountKey, LIMITS.loginAccount)) ||
          (ipKey && (await isRateLimited(ipKey, LIMITS.loginIp)))
        ) {
          return null;
        }

        await connectDB();
        const user = await User.findOne(identifier.includes("@") ? { email: identifier } : { username: identifier })
          .select("+passwordHash")
          .lean();

        let valid = false;
        if (user) {
          valid = await bcrypt.compare(password, user.passwordHash);
        } else {
          // Spend similar time as a real check so accounts can't be probed by response time.
          dummyHash ??= await bcrypt.hash("k-budget-dummy", 12);
          await bcrypt.compare(password, dummyHash);
        }

        if (!user || !valid) {
          await Promise.all([
            recordAttempt(accountKey, LIMITS.loginAccount),
            ipKey ? recordAttempt(ipKey, LIMITS.loginIp) : null,
          ]);
          return null;
        }

        await clearAttempts(accountKey);
        return { id: user._id.toString(), name: user.name, email: user.email, sessionVersion: user.sessionVersion ?? 0 };
      },
    }),
  ],
});

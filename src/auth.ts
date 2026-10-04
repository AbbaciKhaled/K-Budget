import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { connectDB } from "@/lib/db";
import { loginSchema } from "@/lib/validation/auth";
import { User } from "@/models/User";

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
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { identifier, password } = parsed.data;
        await connectDB();
        const user = await User.findOne(identifier.includes("@") ? { email: identifier } : { username: identifier })
          .select("+passwordHash")
          .lean();
        if (!user) {
          // Spend similar time as a real check so accounts can't be probed by response time.
          dummyHash ??= await bcrypt.hash("k-budget-dummy", 12);
          await bcrypt.compare(password, dummyHash);
          return null;
        }
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user._id.toString(), name: user.name, email: user.email };
      },
    }),
  ],
});

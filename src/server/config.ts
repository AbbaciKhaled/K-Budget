import "server-only";

/**
 * Whether new accounts can be created on this instance.
 * Open by default; set SIGNUP_ENABLED=false to make an instance private (existing accounts can still log in).
 * Pages must call `await connection()` first so the value is read at request time, not frozen at build time.
 */
export function isSignupEnabled() {
  return process.env.SIGNUP_ENABLED?.trim().toLowerCase() !== "false";
}

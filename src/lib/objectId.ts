/**
 * Generates a valid MongoDB ObjectId on the client so an optimistic transaction
 * (and its Undo) can reference the same id the server will store.
 */
export function newObjectId() {
  const seconds = Math.floor(Date.now() / 1000).toString(16).padStart(8, "0");
  const random = crypto.getRandomValues(new Uint8Array(8));
  return seconds + Array.from(random, (b) => b.toString(16).padStart(2, "0")).join("");
}

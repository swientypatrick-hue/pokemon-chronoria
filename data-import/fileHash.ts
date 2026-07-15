// Short content hash for static assets served straight out of public/ (item icons, ...).
// public/ files are copied verbatim into dist/ with no filename hashing (unlike assets
// imported via src/, which Vite content-hashes automatically) - so a changed PNG at the same
// path is invisible to browser/CDN caches until the URL itself changes. Appending
// "?v=<hash>" to the <img src> gives it a URL that changes exactly when the file's bytes do.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

/** First 10 hex chars of the file's SHA-256 - short enough for a query string, long enough
 *  that two different icons never collide in practice. */
export function hashFile(absPath: string): string {
  return createHash("sha256").update(readFileSync(absPath)).digest("hex").slice(0, 10);
}

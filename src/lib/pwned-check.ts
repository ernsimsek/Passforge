/**
 * k-anonymity range query against Have I Been Pwned (Pwned Passwords).
 * Only the first 5 hex chars of the SHA-1 hash leave the browser.
 */
export async function fetchPwnedCount(password: string): Promise<number | null> {
  if (!password || typeof crypto === "undefined" || !crypto.subtle) {
    return null;
  }

  const enc = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-1", enc);
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i]!.toString(16).padStart(2, "0");
  }

  const prefix = hex.slice(0, 5).toUpperCase();
  const suffix = hex.slice(5).toUpperCase();

  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: { "Add-Padding": "true" },
  });

  if (!res.ok) return null;

  const body = await res.text();
  for (const line of body.split("\n")) {
    const [hashSuffix, countStr] = line.trim().split(":");
    if (!hashSuffix || !countStr) continue;
    if (hashSuffix.toUpperCase() === suffix) {
      const n = Number.parseInt(countStr, 10);
      return Number.isFinite(n) ? n : null;
    }
  }

  return 0;
}

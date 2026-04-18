import { buildPools, unionPool, type CharsetFlags } from "@/lib/char-pools";
import { randomIntBelow, shuffleInPlace } from "@/lib/secure-random";

export function generatePassword(length: number, flags: CharsetFlags): string {
  const pools = buildPools(flags);
  if (pools.length === 0) {
    throw new Error("Select at least one character set.");
  }
  if (length < pools.length) {
    throw new Error(
      `Length must be at least ${pools.length} to include every selected set once.`,
    );
  }

  const picks: string[] = [];
  for (const pool of pools) {
    picks.push(pool[randomIntBelow(pool.length)]!);
  }

  const alphabet = unionPool(pools);
  while (picks.length < length) {
    picks.push(alphabet[randomIntBelow(alphabet.length)]!);
  }

  shuffleInPlace(picks);
  return picks.join("");
}

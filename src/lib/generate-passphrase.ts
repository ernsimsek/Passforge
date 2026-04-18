import { wordlist } from "@scure/bip39/wordlists/english.js";
import { randomIntBelow } from "@/lib/secure-random";

const raw = wordlist as unknown as string | readonly string[];
const WORDS: readonly string[] = Array.isArray(raw)
  ? raw
  : (raw as string).trim().split("\n");

export type PassphraseSeparator = "space" | "hyphen" | "dot";

export function generatePassphrase(
  wordCount: number,
  separator: PassphraseSeparator,
  capitalize: boolean,
): string {
  if (wordCount < 3 || wordCount > 24) {
    throw new RangeError("wordCount must be between 3 and 24.");
  }

  const sep =
    separator === "space" ? " " : separator === "hyphen" ? "-" : ".";

  const parts: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    let w = WORDS[randomIntBelow(WORDS.length)]!;
    if (capitalize) {
      w = w.slice(0, 1).toUpperCase() + w.slice(1);
    }
    parts.push(w);
  }

  return parts.join(sep);
}

export const passphraseWordCountEntropyBits = (n: number) => n * 11;

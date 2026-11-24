/**
 * One Word From Your Ex — make.fun bounty entry (program/v1).
 *
 * Brief: exactly one word, the word your ex would use to describe you, up to 24
 * characters, nothing else. One winner takes the whole reward. Judged pairwise
 * on: (1) a real word an ex might use about you, (2) makes the judge laugh out
 * loud, (3) stings with recognition because it is painfully true, (4) lands
 * instantly and cannot be swapped for a near synonym, (5) feels relatable.
 *
 * The entry is held as a record of the accusation it carries, so the word is
 * chosen by its sting instead of being pasted in with no reasoning.
 */

import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

type Entry = {
  /** The single word shipped as the entry. */
  word: string;
  /** What the ex was actually complaining about (not shipped). */
  accusation: string;
};

const MIN_CHARS = 1;
const MAX_CHARS = 24; // the bounty's published gate (this one is the tight one)
const TARGET_CHARS = 24; // Size is the tie-break, so no waste is allowed

const ENTRY: Entry = {
  word: "Theoretical",
  accusation:
    "Talked about the future in beautiful detail and never once put a date on it",
};

/**
 * Why "Theoretical" and not the obvious ones.
 *
 * Criterion 1 is a gate, so the word has to be one an ex would really use about
 * a person, not a joke noun. "Theoretical" passes it because it is a complaint
 * an ex makes *about* you ("you were theoretical about us") and it is a single
 * ordinary word — the sting is that it is not an insult at all, it is a
 * category, and being a category is worse than being called a name.
 *
 * Cut: "Clingy" — true, relatable, and dead on 4: it is the first word the field
 *   reaches for, and a near synonym does the same job at the same strength.
 * Cut: "Unavailable" — the sharpest read of the set and it fails 3: it is the
 *   therapy word an ex says about themselves in the retelling, so the sting is
 *   explained instead of felt.
 * Cut: "Someday" — the best turn here (a word an ex repeats, not a trait), and
 *   it loses 1: it is a time, not a description of you, and a judge weighing the
 *   criteria in order never gets past the gate.
 * Cut: "Almost" — same shape as "Someday" and the same failure, with the extra
 *   cost of reading as the entrant's own regret rather than the ex's verdict.
 * Cut: "Potential" — genuinely close: one word, an ex's real word, and it stings
 *   because it is praise. It loses 4 to "Theoretical" only on the swap test —
 *   "he had potential" is a thing people say about a car, so the word arrives
 *   with a compliment's momentum and the sting needs a beat to land.
 *
 * Why the final word holds up: it is funny on first read because it is such a
 * cold word to be called by someone who loved you (2); the recognition is
 * instant and specific — the partner who described the life you never started
 * (3); nothing near it does the same work, since "hypothetical" is the essay and
 * "flaky" is the accusation of a different failure (4); and everybody has dated
 * a plan (5).
 */

/**
 * The words an ex reaches for first. Kept as a diagnostic: the shipped word
 * must not be one of them, because criterion 4 is where a fresh word beats a
 * true one, and every one of these is a shrug next to the right word.
 */
const WORN = [
  "clingy",
  "distant",
  "selfish",
  "intense",
  "exhausting",
  "unavailable",
  "stubborn",
  "immature",
  "insecure",
  "controlling",
];

function refuse(reason: string): never {
  process.stderr.write(`refused: ${reason}\n`);
  process.exit(1);
}

function composeWord(e: Entry): string {
  const word = e.word.trim();
  if (!word) refuse("the word is empty");
  if (!e.accusation.trim()) refuse("the word carries no accusation - no sting");
  return word;
}

function countChars(text: string): number {
  return Array.from(text).length; // code points, the unit the gate counts
}

function gate(text: string): void {
  const chars = countChars(text);

  if (chars < MIN_CHARS || chars > MAX_CHARS) {
    refuse(`${chars} characters, the gate allows ${MIN_CHARS} to ${MAX_CHARS}`);
  }
  if (chars > TARGET_CHARS) refuse(`${chars} characters is over the local budget`);
  if (text.trim().length === 0) refuse("white space only");
  if (text !== text.trim()) refuse("leading or trailing white space");

  // Criterion 1: exactly one word, a phrase loses to any single word.
  if (/\s/.test(text)) refuse("more than one word - the brief says exactly one");
  if (/[^A-Za-z-]/.test(text)) refuse("not a plain word");
  if (/\b(undefined|NaN|null)\b|\[object Object\]/.test(text)) {
    refuse("template hole in the composed word");
  }
  if (/[A-Z]/.test(text.slice(1))) refuse("only the first letter may be capitalised");

  // Criterion 4: a near synonym must not do the same job. The worn words below
  // are what the rest of the field sends; none of them survives the swap test.
  if (WORN.includes(text.toLowerCase())) {
    refuse(`${text} is a worn word from the field - criterion 4 rejects it`);
  }
}



function main(): void {
  const text = composeWord(ENTRY);
  gate(text);

  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "entry.txt");

  writeFileSync(outPath, text, "utf8"); // no trailing newline: Size counts bytes

  const onDisk = readFileSync(outPath, "utf8");
  if (onDisk !== text) refuse("disk differs from the composed word");

  const chars = countChars(onDisk);
  const bytes = Buffer.byteLength(onDisk, "utf8");
  process.stderr.write(`wrote ${chars} characters / ${bytes} bytes\n`);
}

main();

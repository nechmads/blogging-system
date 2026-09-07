import type { Post } from '@hotmetal/content-core';

/**
 * Cover Stock treats every post as an issue with a cover. These helpers derive
 * the cover's labels from the post alone, so a cover reads the same on the
 * shelf, in the catalogue and at the top of its own article — none of those
 * views knows the post's position in the whole series, which is why there is
 * no "No. 41" here: an issue number that changes between pages is worse than
 * none.
 */

export type Plate = 'deep' | 'tint' | 'paper';

const PLATES: Plate[] = ['deep', 'tint', 'paper'];

/** Plates rotate by shelf position so the row has rhythm. The lead is deep. */
export function plateFor(index: number): Plate {
  return PLATES[index % PLATES.length];
}

/**
 * Shelved cover widths relative to the row's base width — staggered like real
 * books, never uniform. Cycles for longer shelves.
 */
const SIZES = [1.0, 0.95, 1.06, 0.97, 1.03, 0.94, 1.07];

export function shelfSize(shelfIndex: number): number {
  return SIZES[shelfIndex % SIZES.length];
}

/** Title size class: longer titles step down so they never crowd the band or the plate. */
export function fitFor(title: string): 'xl' | 'l' | 'm' | 's' {
  const n = title.trim().length;
  return n <= 30 ? 'xl' : n <= 40 ? 'l' : n <= 56 ? 'm' : 's';
}

function parseDate(iso: string | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "SEP 2026" — the issue's month, the way a periodical labels its cover. */
export function issueMonth(iso: string | undefined): string | null {
  const d = parseDate(iso);
  return d ? d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : null;
}

/** "Sep 2, 2026" — the one date register outside the catalogue. */
export function shortDate(iso: string | undefined): string | null {
  const d = parseDate(iso);
  return d
    ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;
}

/** "2026-09-02" — the catalogue's card-index register. */
export function isoDate(iso: string | undefined): string | null {
  const d = parseDate(iso);
  return d ? d.toISOString().slice(0, 10) : null;
}

export function wordCount(post: Post): number {
  const plain = (post.content ?? '').replace(/<[^>]*>/g, ' ');
  return plain.split(/\s+/).filter(Boolean).length;
}

/** Only claimed when there is enough body text for the estimate to mean anything. */
export function readingMinutes(post: Post): number | null {
  const words = wordCount(post);
  return words >= 120 ? Math.max(1, Math.round(words / 220)) : null;
}

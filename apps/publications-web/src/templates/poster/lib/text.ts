/**
 * Text rules shared by the Poster components. Everything here is a rule that
 * applies to any title or deck the CMS hands us, never hand-setting for one.
 */

/**
 * Length tier for a title. The CSS tier is the no-JS size (the client fit
 * script refines the lead on desktop); the article title is tiered only, since
 * the article page has no fold to fill. Five tiers: the prototype's four plus
 * `xxl` for titles past 80 characters, which the fold at 390px could not hold
 * at the `xl` size.
 */
export type TitleTier = 's' | 'm' | 'l' | 'xl' | 'xxl';

export function titleTier(title: string): TitleTier {
  const n = title.trim().length;
  if (n <= 30) return 's';
  if (n <= 45) return 'm';
  if (n <= 60) return 'l';
  if (n <= 80) return 'xl';
  return 'xxl';
}

/**
 * Bind the last two words of a title with a no-break space so no poster-scale
 * title ends on a single-word line. `text-wrap: pretty` alone did not stop
 * "…is The / Future" in the prototype.
 */
export function glue(title: string): string {
  const trimmed = title.trim().replace(/\s+/g, ' ');
  const cut = trimmed.lastIndexOf(' ');
  if (cut <= 0) return trimmed;
  return `${trimmed.slice(0, cut)} ${trimmed.slice(cut + 1)}`;
}

/** Reading time in minutes, or null when there is too little text to estimate. */
export function readingMinutes(html: string | undefined): number | null {
  if (!html) return null;
  const words = html.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  return words >= 120 ? Math.max(1, Math.round(words / 220)) : null;
}

/** Truncate at a word boundary with an ellipsis; text at or under `max` is returned as is. */
export function clip(text: string, max: number): string {
  const t = text.trim().replace(/\s+/g, ' ');
  if (t.length <= max) return t;
  const head = t.slice(0, max);
  const cut = head.lastIndexOf(' ');
  return `${(cut > max * 0.6 ? head.slice(0, cut) : head).replace(/[,;:—-]+$/, '')}…`;
}

export interface Highlight {
  /** The marked phrase — always the start of the text. */
  mark: string;
  /** Whatever follows it, leading whitespace included. */
  rest: string;
}

/**
 * The one accent use on a screen is a marker band behind a phrase of the deck
 * or opening paragraph. The phrase is chosen by rule, deterministically: the
 * first sentence when it is short enough to read as a phrase, else the first
 * clause, else the first ten words. Always something, so the accent appears
 * exactly once per screen whatever the text.
 */
export function highlightPhrase(text: string): Highlight | null {
  const t = text.trim().replace(/\s+/g, ' ');
  if (!t) return null;
  const MAX = 160;

  const sentence = /^[\s\S]*?[.!?](?=\s|$)/.exec(t);
  let mark = sentence ? sentence[0] : t;
  if (mark.length > MAX) {
    const clause = /^[\s\S]*?(?=[,;:]|\s[—–-]\s)/.exec(t);
    mark = clause && clause[0].length >= 20 && clause[0].length <= MAX
      ? clause[0]
      : t.split(' ').slice(0, 10).join(' ');
  }

  const phrase = mark.trim();
  return { mark: phrase, rest: t.slice(phrase.length) };
}

/** Publisher if the CMS recorded one, otherwise the source's host. */
export function sourceLabel(url: string, publisher: string | undefined): string {
  if (publisher) return publisher;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** Comma-separated label field → trimmed list. */
export function splitLabels(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(',').map((t) => t.trim()).filter(Boolean);
}

import type { Post } from '@hotmetal/content-core';

/**
 * Horizon's time maths. Everything the template draws is placed by a real
 * `publishedAt`, so the scale has to survive real publishing behaviour: bursts,
 * six-month silences, undated drafts and publications that ran for years.
 *
 * The scale is piecewise-linear in whole days. Inside a segment one day is one
 * unit; a silence longer than BREAK_MIN_DAYS is not drawn to scale at all — it
 * is compressed into a break glyph BREAK_UNITS wide and labelled with the
 * number of days it stands for. Even spacing would lie about the dates; a
 * proportional axis would spend 80% of its width on nothing.
 *
 * Edge cases, and what each produces:
 *
 * - 0 posts, or every post undated → `hasAxis` is false. The caller drops the
 *   scale entirely and shows the bare masthead plus an empty state; it never
 *   draws an axis with nothing on it.
 * - 1 post → one segment, one tick, and "now". The padding either side keeps
 *   the single tick off both edges.
 * - Every post on one day → one segment, one tick (ticks are deduplicated by
 *   day; the tick's label says how many posts share it) and "now". Every entry
 *   still hangs at the same x, which is the truth.
 * - Posts with no `publishedAt` → excluded from the scale (`x` is null) but
 *   never dropped from the list: they sort after the dated entries and render
 *   as plain blocks with an "Undated" kicker.
 * - A long-running publication (10 posts over 3 years) → many segments and many
 *   break glyphs. Month numerals are filtered right-to-left so the newest month
 *   always survives, are never closer than MONTH_MIN_GAP, and carry a year
 *   qualifier whenever the axis crosses a year boundary.
 * - The newest post far behind "now" → the last gap is a break like any other,
 *   so a dormant publication reads as dormant instead of stretching its last
 *   post to the right edge.
 */

const DAY_MS = 86_400_000;

/** Clear days kept before the first and after the last tick of a segment. */
export const PAD_DAYS = 4;
/** A silence longer than this is compressed into the break glyph. */
export const BREAK_MIN_DAYS = 45;
/** Width of the break glyph, in day-units of the same scale. */
export const BREAK_UNITS = 2;

/** Vertical rhythm above an archive entry: a base plus a step per day of silence. */
const GAP_BASE_PX = 20;
const GAP_STEP_PX = 8;
const GAP_MAX_DAYS = 8;

/** A month numeral is ~130px wide; keep this much axis between two of them. */
const MONTH_MIN_GAP = 0.12;
/** Past this the numeral would run into "now" and off the right gutter. */
const MONTH_MAX_X = 0.86;
const MONTH_MAX_LABELS = 6;
/** Ticks closer than this keep the tick and drop the day label. */
const TICK_LABEL_MIN_GAP = 0.014;
/** The "now" label needs about this much of the right end to itself. */
const NOW_LABEL_GUARD = 0.045;

const MONTH_NUMERALS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Whole-day index in UTC. Workers run in UTC, so this agrees with the rest of
 * the app's date formatting there; using UTC rather than the host's local zone
 * also keeps a local `astro preview` from sliding a 09:00Z post onto the
 * previous day's tick.
 */
function dayNumber(date: Date): number {
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / DAY_MS);
}

function parseDay(iso: string | undefined): { date: Date; day: number } | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return { date, day: dayNumber(date) };
}

/** "Sep 2" — the tick and kicker label. */
export function shortDate(date: Date): string {
  return `${MONTH_SHORT[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

export function monthKeyOf(date: Date): string {
  return `${date.getUTCFullYear()}-${MONTH_NUMERALS[date.getUTCMonth()]}`;
}

/** How long ago, in words. Neutral: any publication can wear it. */
export function daysAgoLabel(date: Date, now: Date): string {
  const n = dayNumber(now) - dayNumber(date);
  if (n <= 0) return 'today';
  if (n === 1) return 'yesterday';
  return `${n} days ago`;
}

/**
 * The article's margin figure: one large numeral and a caption. It keeps the
 * design's elapsed-time device without the persona copy the prototype baked in.
 */
export function elapsedFigure(date: Date, now: Date): { figure: string; caption: string } {
  const n = Math.max(0, dayNumber(now) - dayNumber(date));
  if (n === 0) return { figure: '0', caption: 'Published today.' };
  if (n < 365) {
    return { figure: String(n), caption: `${n === 1 ? 'day' : 'days'} since this was published.` };
  }
  const years = Math.floor(n / 365);
  const rest = n % 365;
  return {
    figure: String(years),
    caption: `${years === 1 ? 'year' : 'years'} and ${rest} ${rest === 1 ? 'day' : 'days'} since this was published.`,
  };
}

/**
 * Reading time from the rendered body. Only claimed when there is enough text
 * for the estimate to mean anything — the same rule press-machine uses.
 */
export function readingMinutes(html: string | undefined): number | null {
  if (!html) return null;
  const words = html.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  return words >= 120 ? Math.max(1, Math.round(words / 220)) : null;
}

export interface AxisSegment {
  /** Fractions of the axis width. */
  x0: number;
  x1: number;
}

export interface AxisBreak {
  x0: number;
  x1: number;
  /** Days of silence the glyph stands for. */
  days: number;
}

export interface AxisMonth {
  key: string;
  numeral: string;
  /** "September" or "September 2026" once the axis crosses a year. */
  caption: string;
  x: number;
}

export interface AxisTick {
  x: number;
  /** Day of the month; hidden when two ticks would collide. */
  label: string;
  showLabel: boolean;
  href: string;
  ariaLabel: string;
  isNewest: boolean;
}

export interface AxisEntry {
  post: Post;
  /** DOM id, and the tick's anchor target. */
  id: string;
  href: string;
  /** Null for an undated post: listed, but not on the scale. */
  x: number | null;
  monthKey: string | null;
  iso: string | null;
  dateLabel: string | null;
  /** Space above this entry, in px: the cluster rhythm. */
  gapPx: number;
  /** Days between this entry and the one above it; drives the rail's break glyph. */
  silenceDays: number;
  monthNumeral: string | null;
  monthCaption: string | null;
  topic: string | null;
  minutes: number | null;
  dek: string | null;
}

export interface Axis {
  /** False when nothing is dated: the caller draws no scale at all. */
  hasAxis: boolean;
  segments: AxisSegment[];
  breaks: AxisBreak[];
  months: AxisMonth[];
  ticks: AxisTick[];
  /** Label for the accent pennant at the right end. */
  nowLabel: string;
  entries: AxisEntry[];
  /** Month of the newest entry — ink before any scrolling happens. */
  currentMonthKey: string | null;
}

function uniqueSorted(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

/**
 * Build the piecewise scale, then a positioning function over it. "now" is one
 * of the points, so a long silence before today breaks the axis exactly like a
 * silence between two posts.
 */
function buildScale(days: number[], nowDay: number) {
  const points = uniqueSorted([...days, nowDay]);
  const segments: { start: number; end: number }[] = [];
  const gaps: number[] = [];

  let start = points[0] - PAD_DAYS;
  for (let i = 0; i < points.length - 1; i += 1) {
    const silence = points[i + 1] - points[i];
    if (silence > BREAK_MIN_DAYS) {
      segments.push({ start, end: points[i] + PAD_DAYS });
      gaps.push(silence);
      start = points[i + 1] - PAD_DAYS;
    }
  }
  segments.push({ start, end: points[points.length - 1] });

  const spanned = segments.reduce((total, seg) => total + (seg.end - seg.start), 0);
  const total = Math.max(1, spanned + BREAK_UNITS * gaps.length);

  /** Offset in units of the start of segment `i`. */
  const offsets: number[] = [];
  let offset = 0;
  segments.forEach((seg, i) => {
    offsets.push(offset);
    offset += seg.end - seg.start + (i < gaps.length ? BREAK_UNITS : 0);
  });

  function x(day: number): number {
    for (let i = 0; i < segments.length; i += 1) {
      const seg = segments[i];
      if (day <= seg.end || i === segments.length - 1) {
        const clamped = Math.min(Math.max(day, seg.start), seg.end);
        return (offsets[i] + (clamped - seg.start)) / total;
      }
      if (day < segments[i + 1].start) {
        // Inside a compressed silence: pin to the near edge of the glyph.
        return (offsets[i] + (seg.end - seg.start)) / total;
      }
    }
    return 1;
  }

  const axisSegments: AxisSegment[] = segments.map((seg, i) => ({
    x0: offsets[i] / total,
    x1: (offsets[i] + (seg.end - seg.start)) / total,
  }));

  const axisBreaks: AxisBreak[] = gaps.map((days, i) => ({
    x0: axisSegments[i].x1,
    x1: axisSegments[i + 1].x0,
    days,
  }));

  return { segments: axisSegments, breaks: axisBreaks, x, bounds: segments };
}

/** Space above an entry: tight inside a cluster, open after a silence. */
export function gapPx(daysOfSilence: number): number {
  return GAP_BASE_PX + GAP_STEP_PX * Math.min(Math.max(daysOfSilence, 0), GAP_MAX_DAYS);
}

function firstTopic(post: Post): string | null {
  if (!post.topics) return null;
  const topics = post.topics.split(',').map((t) => t.trim()).filter(Boolean);
  return topics[0] ?? null;
}

function dekOf(post: Post): string | null {
  if (post.hook) return post.hook;
  if (post.excerpt) return post.excerpt;
  if (post.subtitle) return post.subtitle;
  if (!post.content) return null;
  const plain = post.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!plain) return null;
  return plain.length <= 200 ? plain : `${plain.slice(0, 200).trimEnd()}...`;
}

/**
 * @param posts newest first (the DAL orders by `published_at desc`)
 * @param now render time — the axis's right edge
 */
export function buildAxis(posts: Post[], now: Date): Axis {
  const resolved = posts.map((post) => ({ post, when: parseDay(post.publishedAt) }));
  const dated = resolved
    .filter((r): r is { post: Post; when: { date: Date; day: number } } => r.when !== null)
    .sort((a, b) => b.when.day - a.when.day);
  const undated = resolved.filter((r) => r.when === null);

  const nowDay = dayNumber(now);
  const nowLabel = `Now · ${shortDate(now)}`;

  if (dated.length === 0) {
    return {
      hasAxis: false,
      segments: [],
      breaks: [],
      months: [],
      ticks: [],
      nowLabel,
      currentMonthKey: null,
      entries: [...dated, ...undated].map(({ post }, i) => ({
        post,
        id: `hz-e-${post.slug}`,
        href: `/${post.slug}`,
        x: null,
        monthKey: null,
        iso: null,
        dateLabel: null,
        gapPx: i === 0 ? 0 : gapPx(0),
        silenceDays: 0,
        monthNumeral: null,
        monthCaption: null,
        topic: firstTopic(post),
        minutes: readingMinutes(post.content),
        dek: dekOf(post),
      })),
    };
  }

  const scale = buildScale(dated.map((d) => d.when.day), nowDay);

  /* ------------------------------------------------------------- ticks --- */

  /** One tick per day: a day with three posts is one moment in time, not three. */
  const byDay = new Map<number, { date: Date; posts: Post[] }>();
  for (const { post, when } of dated) {
    const existing = byDay.get(when.day);
    if (existing) existing.posts.push(post);
    else byDay.set(when.day, { date: when.date, posts: [post] });
  }

  const newestDay = dated[0].when.day;
  const tickDays = [...byDay.keys()].sort((a, b) => a - b);
  let lastLabelX = -Infinity;
  const ticks: AxisTick[] = tickDays.map((day) => {
    const group = byDay.get(day)!;
    const x = scale.x(day);
    const showLabel = x - lastLabelX >= TICK_LABEL_MIN_GAP && 1 - x >= NOW_LABEL_GUARD;
    if (showLabel) lastLabelX = x;
    const lead = group.posts[0];
    const label = `${MONTH_SHORT[group.date.getUTCMonth()]} ${group.date.getUTCDate()}`;
    return {
      x,
      label: String(group.date.getUTCDate()),
      showLabel,
      href: `#hz-e-${lead.slug}`,
      ariaLabel:
        group.posts.length > 1
          ? `${label} — ${group.posts.length} posts`
          : `${label} — ${lead.title}`,
      isNewest: day === newestDay,
    };
  });

  /* ------------------------------------------------------------ months --- */

  /** Only months that actually carry a tick — a numeral is a claim about posts. */
  const monthSeen = new Map<string, { date: Date; day: number }>();
  for (const day of tickDays) {
    const group = byDay.get(day)!;
    const key = monthKeyOf(group.date);
    if (!monthSeen.has(key)) {
      const monthStart = Math.floor(
        Date.UTC(group.date.getUTCFullYear(), group.date.getUTCMonth(), 1) / DAY_MS,
      );
      // The month's numeral belongs at the 1st — unless the 1st falls in a
      // compressed silence, where the segment's own start is the honest place.
      const segment = scale.bounds.find((s) => day >= s.start && day <= s.end);
      monthSeen.set(key, { date: group.date, day: Math.max(monthStart, segment ? segment.start : monthStart) });
    }
  }

  const spansYears =
    new Set([...monthSeen.values()].map((m) => m.date.getUTCFullYear())).size > 1;

  const monthCandidates = [...monthSeen.entries()]
    .map(([key, { date, day }]) => ({
      key,
      numeral: MONTH_NUMERALS[date.getUTCMonth()],
      caption: spansYears
        ? `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`
        : MONTH_NAMES[date.getUTCMonth()],
      x: Math.min(scale.x(day), MONTH_MAX_X),
      sort: day,
    }))
    .sort((a, b) => a.sort - b.sort);

  // Filtered from the right so the newest month — the one drawn in ink — is
  // never the label that gets dropped for crowding.
  const kept: typeof monthCandidates = [];
  for (let i = monthCandidates.length - 1; i >= 0; i -= 1) {
    const candidate = monthCandidates[i];
    const previous = kept[kept.length - 1];
    if (!previous || previous.x - candidate.x >= MONTH_MIN_GAP) kept.push(candidate);
    if (kept.length >= MONTH_MAX_LABELS) break;
  }
  const months: AxisMonth[] = kept
    .reverse()
    .map(({ key, numeral, caption, x }) => ({ key, numeral, caption, x }));

  /* ----------------------------------------------------------- entries --- */

  const ordered = [...dated, ...undated];
  const entries: AxisEntry[] = ordered.map(({ post, when }, i) => {
    const previous = i > 0 ? ordered[i - 1].when : null;
    const silence = when && previous ? previous.day - when.day : 0;
    return {
      post,
      id: `hz-e-${post.slug}`,
      href: `/${post.slug}`,
      x: when ? scale.x(when.day) : null,
      monthKey: when ? monthKeyOf(when.date) : null,
      iso: post.publishedAt ?? null,
      dateLabel: when ? shortDate(when.date) : null,
      gapPx: i === 0 ? 0 : gapPx(silence),
      silenceDays: silence,
      monthNumeral: when ? MONTH_NUMERALS[when.date.getUTCMonth()] : null,
      monthCaption: when
        ? spansYears
          ? `${MONTH_NAMES[when.date.getUTCMonth()]} ${when.date.getUTCFullYear()}`
          : MONTH_NAMES[when.date.getUTCMonth()]
        : null,
      topic: firstTopic(post),
      minutes: readingMinutes(post.content),
      dek: dekOf(post),
    };
  });

  return {
    hasAxis: true,
    segments: scale.segments,
    breaks: scale.breaks,
    months,
    ticks,
    nowLabel,
    entries,
    currentMonthKey: monthKeyOf(dated[0].when.date),
  };
}

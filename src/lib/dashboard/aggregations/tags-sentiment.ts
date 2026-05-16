import type { SentimentBucket, TagStat } from '../types';
import type { SlimCall } from '../call-metrics';
import { isMeeting } from '../call-metrics';

export function getTagAnalysis(calls: SlimCall[]): TagStat[] {
  const map = new Map<string, { uses: number; bookings: number }>();

  for (const c of calls) {
    for (const tag of c.tags ?? []) {
      const s = map.get(tag) ?? { uses: 0, bookings: 0 };
      s.uses += 1;
      if (isMeeting(c.sub_outcome)) s.bookings += 1;
      map.set(tag, s);
    }
  }

  return [...map.entries()]
    .map(([tag, s]) => ({
      tag,
      uses: s.uses,
      bookings: s.bookings,
      booking_rate: s.uses > 0 ? s.bookings / s.uses : 0,
    }))
    .sort((a, b) => b.booking_rate - a.booking_rate);
}

export function getSentimentCorrelation(calls: SlimCall[]): SentimentBucket[] {
  const buckets = new Map<number, { calls: number; bookings: number }>();

  for (const c of calls) {
    if (c.sentiment_score == null) continue;
    const score = Math.round(c.sentiment_score);
    const b = buckets.get(score) ?? { calls: 0, bookings: 0 };
    b.calls += 1;
    if (isMeeting(c.sub_outcome)) b.bookings += 1;
    buckets.set(score, b);
  }

  const scores = [-2, -1, 0, 1, 2];
  return scores.map((sentiment) => {
    const b = buckets.get(sentiment) ?? { calls: 0, bookings: 0 };
    return {
      sentiment,
      calls: b.calls,
      bookings: b.bookings,
      booking_rate: b.calls > 0 ? b.bookings / b.calls : 0,
    };
  });
}

export function topTagInsights(tags: TagStat[], minN = 10): string[] {
  const lines: string[] = [];
  const qualified = tags.filter((t) => t.uses >= minN);
  if (qualified[0]) {
    const t = qualified[0];
    lines.push(
      `Tagged with '${t.tag}': ${Math.round(t.booking_rate * 100)}% booking rate (n=${t.uses}).`,
    );
  }
  const worst = [...qualified].sort((a, b) => a.booking_rate - b.booking_rate)[0];
  if (worst && worst.tag !== qualified[0]?.tag) {
    lines.push(
      `Tagged with '${worst.tag}': ${Math.round(worst.booking_rate * 100)}% booking rate (n=${worst.uses}).`,
    );
  }
  return lines;
}

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { SentimentBucket, TagStat } from '@/lib/dashboard/types';
import { formatPct } from './format';

export function DashboardSentimentTags({
  tags,
  sentiment,
  tagInsights,
}: {
  tags: TagStat[];
  sentiment: SentimentBucket[];
  tagInsights: string[];
}) {
  const maxBooking = Math.max(...sentiment.map((s) => s.booking_rate), 0.01);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tags + sentiment that book meetings</CardTitle>
        {tagInsights.length > 0 && (
          <CardDescription>{tagInsights.join(' ')}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="grid gap-8 lg:grid-cols-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tag</TableHead>
              <TableHead>Uses</TableHead>
              <TableHead>Bookings</TableHead>
              <TableHead>Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.slice(0, 20).map((t) => (
              <TableRow key={t.tag}>
                <TableCell>{t.tag}</TableCell>
                <TableCell>
                  {t.uses}
                  {t.uses < 5 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      (low n)
                    </span>
                  )}
                </TableCell>
                <TableCell>{t.bookings}</TableCell>
                <TableCell>{formatPct(t.booking_rate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div>
          <p className="text-sm font-medium mb-3">Booking rate by sentiment</p>
          <div className="flex items-end gap-2 h-32">
            {sentiment.map((b) => (
              <div key={b.sentiment} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-primary/60"
                  style={{
                    height: `${Math.max(4, (b.booking_rate / maxBooking) * 100)}%`,
                  }}
                  title={`${formatPct(b.booking_rate)} (n=${b.calls})`}
                />
                <span className="text-xs">{b.sentiment}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

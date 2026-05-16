import dns from 'dns/promises';
import net from 'net';
import { pickOwnerEmails } from '@/lib/enrich/extract';
import { fieldsFound, makeLogEntry } from '@/lib/enrich/merge';
import type { EnrichedFields } from '@/lib/enrich/types';

type VerifyResult = 'verified' | 'risky' | 'invalid' | 'unverified';

async function verifyEmailSmtp(email: string): Promise<VerifyResult> {
  const domain = email.split('@')[1];
  if (!domain) return 'invalid';

  let mx: { exchange: string; priority: number }[];
  try {
    mx = await dns.resolveMx(domain);
  } catch {
    return 'unverified';
  }
  if (!mx.length) return 'invalid';

  const host = mx.sort((a, b) => a.priority - b.priority)[0].exchange;

  return new Promise((resolve) => {
    const socket = net.createConnection(25, host);
    let step = 0;

    const finish = (result: VerifyResult) => {
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(8000, () => finish('unverified'));

    socket.on('data', (buf) => {
      const line = buf.toString();
      if (step === 0 && line.startsWith('220')) {
        socket.write('HELO twentyfour.app\r\n');
        step = 1;
      } else if (step === 1 && line.startsWith('250')) {
        socket.write('MAIL FROM:<verify@twentyfour.app>\r\n');
        step = 2;
      } else if (step === 2 && line.startsWith('250')) {
        socket.write(`RCPT TO:<${email}>\r\n`);
        step = 3;
      } else if (step === 3) {
        if (line.startsWith('250')) finish('verified');
        else if (line.startsWith('550') || line.startsWith('551')) finish('invalid');
        else finish('risky');
      }
    });

    socket.on('error', () => finish('unverified'));
  });
}

function rankStatus(a: VerifyResult, b: VerifyResult): number {
  const order: VerifyResult[] = ['verified', 'risky', 'unverified', 'invalid'];
  return order.indexOf(a) - order.indexOf(b);
}

/** Run after other sources merged emails into accumulated data. */
export async function verifyEmailsInFields(
  emails: string[],
  currentOwnerEmail?: string | null,
): Promise<Partial<EnrichedFields>> {
  const start = Date.now();
  const list = pickOwnerEmails([...new Set(emails)]);
  if (!list.length) {
    return {
      source_log: [
        makeLogEntry('smtp_verify', false, [], Date.now() - start, 'no_emails'),
      ],
    };
  }

  const statuses: Record<string, VerifyResult> = {};
  for (const email of list.slice(0, 5)) {
    try {
      statuses[email] = await verifyEmailSmtp(email);
    } catch {
      statuses[email] = 'unverified';
    }
  }

  const sorted = [...list].sort(
    (a, b) => rankStatus(statuses[a], statuses[b]) - rankStatus(statuses[b], statuses[a]),
  );
  const best = sorted[0];
  const patch: Partial<EnrichedFields> = {
    owner_email: currentOwnerEmail ?? best,
    owner_email_status: statuses[best] ?? 'unverified',
    emails_found: list,
  };

  return {
    ...patch,
    source_log: [
      makeLogEntry('smtp_verify', true, fieldsFound(patch), Date.now() - start),
    ],
  };
}

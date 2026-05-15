import { config } from 'dotenv';

config({ path: '.env.local' });

async function main() {
  const { encrypt, decrypt } = await import('../src/lib/crypto');
  const sample = 'lead-engine-crypto-round-trip';
  const sealed = encrypt(sample);
  const opened = decrypt(sealed);
  if (opened !== sample) {
    console.error('Round-trip mismatch');
    process.exit(1);
  }
  console.log('OK');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'failed');
  process.exit(1);
});

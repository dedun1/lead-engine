/**
 * Regenerates src/types/database.types.ts from the linked Supabase project.
 *
 * Run after every migration: `pnpm run generate-types`.
 *
 * Prerequisites (one-time, see README):
 *   1. Supabase CLI installed via Scoop (Windows) / brew (macOS) / binary (Linux).
 *      Do NOT use `npm install -g supabase` — Supabase blocks global npm installs.
 *      Verify with: `supabase --version`
 *   2. Project linked: `supabase link --project-ref <ref>`
 *   3. Logged in: `supabase login`
 */
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const OUT_PATH = resolve(process.cwd(), 'src/types/database.types.ts');

try {
  // --linked reads the project_ref from supabase/config.toml (set by `supabase link`).
  // --schema public limits output to the application schema (skips auth, storage, etc.).
  const types = execSync('supabase gen types typescript --linked --schema public', {
    encoding: 'utf-8',
    // Inherit stderr so CLI errors (auth / network / missing link) surface immediately.
    stdio: ['inherit', 'pipe', 'inherit'],
  });

  writeFileSync(OUT_PATH, types);
  console.log(`Wrote ${OUT_PATH} (${types.split('\n').length} lines)`);
} catch (err) {
  console.error('Failed to generate types. Check that:');
  console.error('  - Supabase CLI is installed (`supabase --version`)');
  console.error('  - You are logged in (`supabase login`)');
  console.error('  - The project is linked (`supabase link --project-ref <ref>`)');
  if (err instanceof Error) console.error(`\n${err.message}`);
  process.exit(1);
}

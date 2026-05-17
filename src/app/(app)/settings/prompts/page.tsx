import { stat } from 'fs/promises';
import path from 'path';
import { PROMPT_REGISTRY } from '@/lib/ai/prompt-registry';
import { PromptCard } from './prompt-card';
import { Card, CardContent } from '@/components/ui/card';

async function fileMtimeLabel(relativePath: string): Promise<string> {
  try {
    const full = path.join(process.cwd(), relativePath);
    const s = await stat(full);
    return `as of ${s.mtime.toLocaleString()}`;
  } catch {
    return 'mtime unavailable';
  }
}

export default async function PromptsPage() {
  const entries = await Promise.all(
    PROMPT_REGISTRY.map(async (entry) => ({
      id: entry.id,
      title: entry.title,
      sourceFile: entry.source_file,
      exportName: entry.export_name,
      text: entry.getText(),
      modifiedLabel: await fileMtimeLabel(entry.source_file),
    })),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Prompts</h1>
        <p className="text-sm text-muted-foreground">
          Read-only view of Haiku prompts in this build.
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Prompts are baked into the build. To customize, edit the source file and redeploy.
          Per-team prompt overrides are a Phase 2 feature.
        </CardContent>
      </Card>

      <div className="space-y-6">
        {entries.map((e) => (
          <PromptCard
            key={e.id}
            title={e.title}
            sourceFile={e.sourceFile}
            exportName={e.exportName}
            modifiedLabel={e.modifiedLabel}
            text={e.text}
          />
        ))}
      </div>
    </div>
  );
}

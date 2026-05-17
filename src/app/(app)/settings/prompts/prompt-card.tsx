'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
export function PromptCard({
  title,
  sourceFile,
  exportName,
  modifiedLabel,
  text,
}: {
  title: string;
  sourceFile: string;
  exportName: string;
  modifiedLabel: string;
  text: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copy failed');
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="font-mono text-xs text-muted-foreground">
            {sourceFile} → {exportName}
          </p>
          <p className="text-xs text-muted-foreground">{modifiedLabel}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => void copy()}>
          <Copy className="h-3 w-3 mr-1" />
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </CardHeader>
      <CardContent>
        <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs font-mono whitespace-pre-wrap">
          {text}
        </pre>
      </CardContent>
    </Card>
  );
}

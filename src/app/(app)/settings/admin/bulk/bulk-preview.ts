/** Shared preview count fetch for bulk operation forms. */
export async function fetchBulkPreviewCount(filters: {
  niche_id: string;
  region?: string;
  statuses?: string[];
  assigned_to?: string;
}): Promise<number> {
  const res = await fetch('/api/admin/bulk/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filters),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Preview failed');
  return json.count as number;
}

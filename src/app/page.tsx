// Placeholder home route. Prompt 5 replaces this with the default-landing
// redirect logic from PROJECT_SPEC §12 once auth + the (app) sidebar shell exist.
export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Lead Engine</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Project scaffolded. Phase 1 in progress.
        </p>
      </div>
    </main>
  );
}

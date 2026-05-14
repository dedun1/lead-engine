import { LoginForm } from './login-form';

// Server component shell — the form itself is a client component because it
// calls supabase.auth.signInWithOtp() from the browser to send the magic link.
export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirectTo?: string; error?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold">
            L
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Lead Engine</h1>
          <p className="text-sm text-muted-foreground">
            Internal tool for the TwentyFour sales team. Invite only.
          </p>
        </div>
        {searchParams.error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            Sign in failed: {decodeURIComponent(searchParams.error)}
          </div>
        )}
        <LoginForm redirectTo={searchParams.redirectTo} />
      </div>
    </main>
  );
}

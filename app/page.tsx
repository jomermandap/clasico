import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-xl space-y-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Weekend Market
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Clásico Tracking System
 
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Sign in to access merchant rent, spot reservations, and expenses. This landing page is just a
          simple entry point and will not auto-redirect.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/auth/login"
            className={buttonVariants({ variant: "default", size: "lg" })}
          >
            Log in
          </Link>
          <Link
            href="/auth/sign-up"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/login-form";
import { SignUpForm } from "@/components/sign-up-form";

type Mode = "login" | "sign-up";

export function AuthLanding({
  initialMode = "login",
  className,
}: {
  initialMode?: Mode;
  className?: string;
}) {
  const [mode, setMode] = React.useState<Mode>(initialMode);

  return (
    <main className={cn("min-h-screen bg-background", className)}>
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-stretch justify-center gap-10 px-4 py-10 md:grid md:grid-cols-2 md:items-center md:py-16">
        <section className="space-y-6 text-center md:space-y-8 md:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Weekend Market
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Clásico Tracking System
          </h1>
          <p className="max-w-prose text-sm text-muted-foreground sm:text-base">
            Track merchant rent (paid/pending), spot reservations, and weekly expenses for your Thu–Sun
            market run.
          </p>
          <div className="inline-flex rounded-lg border bg-muted/40 p-1">
            <Button
              type="button"
              variant={mode === "login" ? "default" : "ghost"}
              size="sm"
              className={cn("h-9 rounded-md px-4", mode !== "login" && "text-muted-foreground")}
              onClick={() => setMode("login")}
            >
              Log in
            </Button>
            <Button
              type="button"
              variant={mode === "sign-up" ? "default" : "ghost"}
              size="sm"
              className={cn("h-9 rounded-md px-4", mode !== "sign-up" && "text-muted-foreground")}
              onClick={() => setMode("sign-up")}
            >
              Create account
            </Button>
          </div>
        </section>

        <section className="w-full">
          <div className="mx-auto w-full max-w-sm pb-8 md:pb-0">
            {mode === "login" ? (
              <LoginForm showSwitchLinks={false} onSwitchMode={() => setMode("sign-up")} />
            ) : (
              <SignUpForm showSwitchLinks={false} onSwitchMode={() => setMode("login")} />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}


"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FabButtonProps {
  onClick?: () => void;
  href?: string;
  label: string;
  icon?: LucideIcon;
}

export function FabButton({
  onClick,
  href,
  label,
  icon: Icon = Plus,
}: FabButtonProps) {
  const content = (
    <Button
      type="button"
      onClick={onClick}
      className="h-14 px-5 gap-2 rounded-full shadow-lg"
    >
      <Icon className="h-5 w-5" />
      <span className="text-sm font-medium">{label}</span>
    </Button>
  );

  return (
    <div className="fixed bottom-24 right-4 z-40">
      {href ? <Link href={href}>{content}</Link> : content}
    </div>
  );
}


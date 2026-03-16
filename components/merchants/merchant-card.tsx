import { User, Tag, Phone } from "lucide-react";
import type { Merchant } from "@/lib/types";
import { BoothTypeBadge } from "@/components/shared/booth-type-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MerchantCardProps {
  merchant: Merchant;
  onEdit: () => void;
  onDelete: () => void;
}

export function MerchantCard({
  merchant,
  onEdit,
  onDelete,
}: MerchantCardProps) {
  const isActive = merchant.is_active;

  return (
    <Card className="w-full rounded-xl">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <BoothTypeBadge type={merchant.booth_type} />
            <span className="font-mono text-sm text-muted-foreground">
              {merchant.booth_number}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span
              className={
                isActive ? "text-emerald-500" : "text-muted-foreground"
              }
            >
              ●
            </span>
            <span className="text-muted-foreground">
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <div className="mt-2 text-lg font-semibold">
          {merchant.business_name}
        </div>

        <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <User className="h-3.5 w-3.5" />
          <span>{merchant.name}</span>
        </div>

        {merchant.product_category && (
          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Tag className="h-3.5 w-3.5" />
            <span>{merchant.product_category}</span>
          </div>
        )}

        {merchant.contact_number && (
          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Phone className="h-3.5 w-3.5" />
            <span>{merchant.contact_number}</span>
          </div>
        )}

        <div className="mt-3 flex gap-2 border-t pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 h-10"
            onClick={onEdit}
          >
            Edit
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-10 text-destructive"
            onClick={onDelete}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


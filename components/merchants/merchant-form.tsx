"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { BoothType, Merchant } from "@/lib/types";
import { BOOTH_NUMBERS, PRODUCT_CATEGORIES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export interface MerchantFormData {
  name: string;
  business_name: string;
  contact_number?: string;
  email?: string;
  booth_type: BoothType;
  booth_number: string;
  product_category?: string;
  notes?: string;
  is_active?: boolean;
}

interface MerchantFormProps {
  initialData?: Partial<Merchant>;
  onSubmit: (data: MerchantFormData) => Promise<void>;
  loading?: boolean;
}

type FieldErrors = Partial<Record<keyof MerchantFormData, string>>;

export function MerchantForm({
  initialData,
  onSubmit,
  loading = false,
}: MerchantFormProps) {
  const [formData, setFormData] = useState<MerchantFormData>({
    business_name: initialData?.business_name ?? "",
    name: initialData?.name ?? "",
    contact_number: initialData?.contact_number ?? "",
    email: initialData?.email ?? "",
    booth_type: initialData?.booth_type as BoothType,
    booth_number: initialData?.booth_number ?? "",
    product_category: initialData?.product_category ?? "",
    notes: initialData?.notes ?? "",
    is_active:
      typeof initialData?.is_active === "boolean" ? initialData.is_active : true,
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    // When switching into edit mode or when edit data changes, sync the form.
    if (!initialData) return;
    setFormData({
      business_name: initialData.business_name ?? "",
      name: initialData.name ?? "",
      contact_number: initialData.contact_number ?? "",
      email: initialData.email ?? "",
      booth_type: initialData.booth_type as BoothType,
      booth_number: initialData.booth_number ?? "",
      product_category: initialData.product_category ?? "",
      notes: initialData.notes ?? "",
      is_active:
        typeof initialData.is_active === "boolean" ? initialData.is_active : true,
    });
  }, [initialData]);

  const validate = (data: MerchantFormData): FieldErrors => {
    const newErrors: FieldErrors = {};

    if (!data.business_name?.trim()) {
      newErrors.business_name = "Business name is required.";
    }
    if (!data.name?.trim()) {
      newErrors.name = "Contact person name is required.";
    }
    if (!data.booth_type) {
      newErrors.booth_type = "Booth type is required.";
    }
    if (!data.booth_number?.trim()) {
      newErrors.booth_number = "Booth number is required.";
    }

    return newErrors;
  };

  const handleChange =
    (field: keyof MerchantFormData) =>
    (value: string | boolean | undefined) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleBoothTypeChange = (value: BoothType) => {
    setFormData((prev) => ({
      ...prev,
      booth_type: value,
      booth_number: "",
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitAttempted(true);

    const validationErrors = validate(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const payload: MerchantFormData = {
      ...formData,
      business_name: formData.business_name.trim(),
      name: formData.name.trim(),
      booth_number: formData.booth_number.trim(),
      is_active:
        typeof formData.is_active === "boolean" ? formData.is_active : true,
    };

    await onSubmit(payload);
  };

  const boothNumbers =
    formData.booth_type && BOOTH_NUMBERS[formData.booth_type]
      ? BOOTH_NUMBERS[formData.booth_type]
      : [];

  const isEditMode = Boolean(initialData);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="business_name">Business Name*</Label>
        <Input
          id="business_name"
          value={formData.business_name}
          onChange={(e) => handleChange("business_name")(e.target.value)}
          disabled={loading}
          autoComplete="organization"
        />
        {submitAttempted && errors.business_name && (
          <p className="text-sm text-destructive">{errors.business_name}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">Contact Person Name*</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange("name")(e.target.value)}
          disabled={loading}
          autoComplete="name"
        />
        {submitAttempted && errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact_number">Contact Number</Label>
        <Input
          id="contact_number"
          value={formData.contact_number ?? ""}
          onChange={(e) => handleChange("contact_number")(e.target.value)}
          disabled={loading}
          placeholder="09XX XXX XXXX"
          inputMode="tel"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email ?? ""}
          onChange={(e) => handleChange("email")(e.target.value)}
          disabled={loading}
          autoComplete="email"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Booth Type*</Label>
        <Select
          disabled={loading}
          value={formData.booth_type ?? ""}
          onValueChange={(value) => handleBoothTypeChange(value as BoothType)}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select booth type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="wall">Wall Booth</SelectItem>
            <SelectItem value="garden">Garden Booth</SelectItem>
            <SelectItem value="outdoor">Outdoor Booth</SelectItem>
          </SelectContent>
        </Select>
        {submitAttempted && errors.booth_type && (
          <p className="text-sm text-destructive">{errors.booth_type}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Booth Number*</Label>
        <Select
          disabled={loading || !formData.booth_type}
          value={formData.booth_number ?? ""}
          onValueChange={(value) => handleChange("booth_number")(value)}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select booth number" />
          </SelectTrigger>
          <SelectContent>
            {boothNumbers.map((booth) => (
              <SelectItem key={booth} value={booth}>
                {booth}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {submitAttempted && errors.booth_number && (
          <p className="text-sm text-destructive">{errors.booth_number}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Product Category</Label>
        <Select
          disabled={loading}
          value={formData.product_category ?? ""}
          onValueChange={(value) => handleChange("product_category")(value)}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select product category" />
          </SelectTrigger>
          <SelectContent>
            {PRODUCT_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes ?? ""}
          onChange={(e) => handleChange("notes")(e.target.value)}
          disabled={loading}
          rows={3}
        />
      </div>

      {isEditMode && (
        <div className="flex items-center justify-between rounded-lg border px-3 py-2">
          <div className="space-y-0.5">
            <Label htmlFor="is_active">Active</Label>
            <p className="text-xs text-muted-foreground">
              Toggle to deactivate this merchant without deleting them.
            </p>
          </div>
          <Switch
            id="is_active"
            checked={formData.is_active ?? true}
            onCheckedChange={(checked) =>
              handleChange("is_active")(Boolean(checked))
            }
            disabled={loading}
          />
        </div>
      )}

      <Button
        type="submit"
        className="mt-2 h-12 w-full"
        disabled={loading}
      >
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        {isEditMode ? "Save Merchant" : "Add Merchant"}
      </Button>
    </form>
  );
}


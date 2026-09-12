export type DiscountType = "percentage" | "fixed";

export interface MapProductDiscount {
  type: DiscountType;
  value: number;
  startDate?: string | null;
  endDate?: string | null;
}

export interface MapProductPricing {
  sellingPrice: number;
  costPrice: number | null;
  currency: string;
}

export interface MapProductAdmin {
  id: string;
  name: string;
  slug: string;
  description: string;
  pricing: MapProductPricing;
  discount: MapProductDiscount | null;
  isActive: boolean;
  purchaseCount: number;
  createdAt: string | null;
}

/** Payload for POST /map-products (create) and the general PATCH. */
export interface MapProductFormInput {
  name: string;
  slug: string;
  description: string;
  pricing: {
    sellingPrice: number;
    costPrice: number | null;
    currency: string;
  };
  discount: MapProductDiscount | null;
  isActive: boolean;
}

/** Payload for the dedicated pricing-only PATCH endpoint. */
export interface MapProductPricingInput {
  sellingPrice?: number;
  costPrice?: number | null;
  currency?: string;
  discount?: MapProductDiscount | null;
}
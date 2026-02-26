// types/promo.ts

export interface PromoCode {
  _id: string;
  code: string;
  description: string | null;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number;
  applicableProducts: string[];
  applicableCategories: string[];
  usageLimit: number | null;
  usageLimitPerUser: number | null;
  usageCount: number;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  isPublic: boolean;
  applyToDelivery: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PromoApplyResult {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  discountAmount: number;
  finalSubtotal: number;
}
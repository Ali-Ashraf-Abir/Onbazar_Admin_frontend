import api from "@/lib/api";
import type {
  MapProductAdmin,
  MapProductFormInput,
  MapProductPricingInput,
} from "../types/mapProduct";

/**
 * ROUTE ASSUMPTIONS — I don't have your router file for
 * mapProduct.controller.js, only the controller. `lib/api.ts`'s BASE_URL is
 * "/api", so these paths are relative to that. They follow the REST
 * convention your other admin resources seem to use — adjust below if your
 * actual mounting differs.
 */
const ROUTES = {
  listAdmin: () => `/map-products/`,
  create: () => `/map-products`,
  getById: (id: string) => `/map-products/${id}`,
  patch: (id: string) => `/map-products/${id}`,
  patchPricing: (id: string) => `/map-products/${id}/pricing`,
  toggleActive: (id: string) => `/map-products/${id}/toggle-active`,
  remove: (id: string) => `/map-products/${id}`,
};

function normalize(raw: any): MapProductAdmin {
  return {
    id: raw?._id ?? raw?.id,
    name: raw?.name ?? "",
    slug: raw?.slug ?? "",
    description: raw?.description ?? "",
    pricing: {
      sellingPrice: raw?.pricing?.sellingPrice ?? 0,
      costPrice: raw?.pricing?.costPrice ?? null,
      currency: raw?.pricing?.currency ?? "BDT",
    },
    discount: raw?.discount
      ? {
          type: raw.discount.type,
          value: raw.discount.value,
          startDate: raw.discount.startDate ?? null,
          endDate: raw.discount.endDate ?? null,
        }
      : null,
    isActive: raw?.isActive ?? true,
    purchaseCount: raw?.purchaseCount ?? 0,
    createdAt: raw?.createdAt ?? null,
  };
}

export async function adminListMapProducts(): Promise<MapProductAdmin[]> {
  const json = await api.get<{ success: boolean; data: any[] }>(ROUTES.listAdmin());
  return (json.data || []).map(normalize);
}

export async function getMapProductById(id: string): Promise<MapProductAdmin> {
  const json = await api.get<{ success: boolean; data: any }>(ROUTES.getById(id));
  return normalize(json.data);
}

export async function createMapProduct(
  input: MapProductFormInput
): Promise<MapProductAdmin> {
  const json = await api.post<{ success: boolean; data: any }>(ROUTES.create(), input);
  return normalize(json.data);
}

export async function patchMapProduct(
  id: string,
  input: Partial<MapProductFormInput>
): Promise<MapProductAdmin> {
  const json = await api.patch<{ success: boolean; data: any }>(ROUTES.patch(id), input);
  return normalize(json.data);
}

export async function updateMapProductPricing(
  id: string,
  input: MapProductPricingInput
): Promise<MapProductAdmin> {
  const json = await api.patch<{ success: boolean; data: any }>(
    ROUTES.patchPricing(id),
    input
  );
  return normalize(json.data);
}

export async function toggleMapProductActive(id: string): Promise<MapProductAdmin> {
  const json = await api.patch<{ success: boolean; data: any }>(
    ROUTES.toggleActive(id)
  );
  return normalize(json.data);
}

export async function deleteMapProduct(id: string): Promise<void> {
  await api.delete<{ success: boolean }>(ROUTES.remove(id));
}
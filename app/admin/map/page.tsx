'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Tag, Trash2, X } from 'lucide-react';
import { ApiError } from '@/lib/api';
import {
  adminListMapProducts,
  createMapProduct,
  patchMapProduct,
  updateMapProductPricing,
  toggleMapProductActive,
  deleteMapProduct,
} from '../../../lib/mapProductApi';
import type {
  MapProductAdmin,
  MapProductFormInput,
  DiscountType,
} from '../../../types/mapProduct';

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function money(currency: string, value: number) {
  return `${currency} ${value.toLocaleString()}`;
}

function effectivePrice(product: MapProductAdmin) {
  const { sellingPrice } = product.pricing;
  const d = product.discount;
  if (!d) return sellingPrice;

  const now = Date.now();
  const started = !d.startDate || new Date(d.startDate).getTime() <= now;
  const notEnded = !d.endDate || new Date(d.endDate).getTime() >= now;
  if (!started || !notEnded) return sellingPrice;

  if (d.type === 'percentage') return sellingPrice * (1 - d.value / 100);
  return Math.max(0, sellingPrice - d.value);
}

/* ─────────────────────── shared form state shape ─────────────────────── */

type FormState = {
  name: string;
  slug: string;
  slugTouched: boolean;
  description: string;
  sellingPrice: string;
  costPrice: string;
  currency: string;
  discountType: DiscountType | 'none';
  discountValue: string;
  discountStart: string;
  discountEnd: string;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  name: '',
  slug: '',
  slugTouched: false,
  description: '',
  sellingPrice: '',
  costPrice: '',
  currency: 'BDT',
  discountType: 'none',
  discountValue: '',
  discountStart: '',
  discountEnd: '',
  isActive: true,
};

function formFromProduct(product: MapProductAdmin): FormState {
  return {
    name: product.name,
    slug: product.slug,
    slugTouched: true,
    description: product.description,
    sellingPrice: String(product.pricing.sellingPrice ?? ''),
    costPrice: product.pricing.costPrice != null ? String(product.pricing.costPrice) : '',
    currency: product.pricing.currency || 'BDT',
    discountType: product.discount?.type ?? 'none',
    discountValue: product.discount ? String(product.discount.value) : '',
    discountStart: product.discount?.startDate ? product.discount.startDate.slice(0, 10) : '',
    discountEnd: product.discount?.endDate ? product.discount.endDate.slice(0, 10) : '',
    isActive: product.isActive,
  };
}

function buildPayload(form: FormState): MapProductFormInput {
  const discount =
    form.discountType === 'none' || !form.discountValue
      ? null
      : {
          type: form.discountType,
          value: Number(form.discountValue),
          startDate: form.discountStart || null,
          endDate: form.discountEnd || null,
        };

  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    description: form.description.trim(),
    pricing: {
      sellingPrice: Number(form.sellingPrice) || 0,
      costPrice: form.costPrice ? Number(form.costPrice) : null,
      currency: form.currency.trim() || 'BDT',
    },
    discount,
    isActive: form.isActive,
  };
}

/* ─────────────────────────── page ─────────────────────────── */

export default function MapProductsAdminPage() {
  const [products, setProducts] = useState<MapProductAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [priceEditId, setPriceEditId] = useState<string | null>(null);
  const [priceForm, setPriceForm] = useState<FormState>(EMPTY_FORM);
  const [priceSaving, setPriceSaving] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await adminListMapProducts();
      setProducts(data);
    } catch (error) {
      setLoadError(errorMessage(error, 'Could not load map products.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  /* ── create / edit modal ── */

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (product: MapProductAdmin) => {
    setEditingId(product.id);
    setForm(formFromProduct(product));
    setFormError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
  };

  const submitForm = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      setFormError('Name and slug are required.');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const payload = buildPayload(form);

      if (editingId) {
        const updated = await patchMapProduct(editingId, payload);
        setProducts((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
      } else {
        const created = await createMapProduct(payload);
        setProducts((prev) => [created, ...prev]);
      }

      setFormOpen(false);
    } catch (error) {
      setFormError(errorMessage(error, 'Could not save this product.'));
    } finally {
      setSaving(false);
    }
  };

  /* ── quick price modal ── */

  const openPriceEdit = (product: MapProductAdmin) => {
    setPriceEditId(product.id);
    setPriceForm(formFromProduct(product));
    setPriceError(null);
  };

  const closePriceEdit = () => {
    if (priceSaving) return;
    setPriceEditId(null);
  };

  const submitPriceEdit = async () => {
    if (!priceEditId) return;

    setPriceSaving(true);
    setPriceError(null);

    try {
      const discount =
        priceForm.discountType === 'none' || !priceForm.discountValue
          ? null
          : { type: priceForm.discountType, value: Number(priceForm.discountValue) };

      const updated = await updateMapProductPricing(priceEditId, {
        sellingPrice: Number(priceForm.sellingPrice) || 0,
        costPrice: priceForm.costPrice ? Number(priceForm.costPrice) : null,
        currency: priceForm.currency.trim() || 'BDT',
        discount,
      });

      setProducts((prev) => prev.map((p) => (p.id === priceEditId ? updated : p)));
      setPriceEditId(null);
    } catch (error) {
      setPriceError(errorMessage(error, 'Could not update pricing.'));
    } finally {
      setPriceSaving(false);
    }
  };

  /* ── toggle active / delete ── */

  const handleToggleActive = async (product: MapProductAdmin) => {
    setBusyId(product.id);
    setListError(null);
    try {
      const updated = await toggleMapProductActive(product.id);
      setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
    } catch (error) {
      setListError(errorMessage(error, 'Could not change active status.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (product: MapProductAdmin) => {
    const confirmed = window.confirm(`Delete "${product.name}"? This can't be undone.`);
    if (!confirmed) return;

    setBusyId(product.id);
    setListError(null);
    try {
      await deleteMapProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (error) {
      setListError(errorMessage(error, 'Could not delete this product.'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-neutral-900 font-sans lg:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-medium tracking-[-0.02em]">
              Map Poster Products
            </h1>
            <p className="mt-1 text-[13px] text-neutral-500">
              Manage pricing, discounts, and availability for the map-poster product line.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="flex h-10 items-center gap-2 bg-neutral-900 px-4 text-[13px] font-medium text-white transition hover:bg-neutral-700"
          >
            <Plus size={16} />
            New product
          </button>
        </div>

        {listError && (
          <p className="mb-4 border border-red-200 bg-red-50 px-4 py-2 text-[13px] text-red-600">
            {listError}
          </p>
        )}

        {loading ? (
          <p className="text-[13px] text-neutral-500">Loading products…</p>
        ) : loadError ? (
          <div className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">
            {loadError}
            <button
              type="button"
              onClick={loadProducts}
              className="ml-3 underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="border border-neutral-200 px-4 py-10 text-center text-[13px] text-neutral-500">
            No map products yet. Create one to start selling posters.
          </div>
        ) : (
          <div className="overflow-x-auto border border-neutral-200">
            <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Discount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Purchases</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const eff = effectivePrice(product);
                  const hasDiscount = eff < product.pricing.sellingPrice;
                  const rowBusy = busyId === product.id;

                  return (
                    <tr key={product.id} className="border-b border-neutral-100 last:border-0">
                      <td className="px-4 py-3">
                        <div className="font-medium text-neutral-900">{product.name}</div>
                        <div className="text-neutral-400">/{product.slug}</div>
                      </td>

                      <td className="px-4 py-3">
                        {hasDiscount ? (
                          <div>
                            <span className="text-neutral-400 line-through">
                              {money(product.pricing.currency, product.pricing.sellingPrice)}
                            </span>{' '}
                            <span className="font-medium">
                              {money(product.pricing.currency, eff)}
                            </span>
                          </div>
                        ) : (
                          <span>{money(product.pricing.currency, product.pricing.sellingPrice)}</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-neutral-500">
                        {product.discount
                          ? product.discount.type === 'percentage'
                            ? `${product.discount.value}%`
                            : money(product.pricing.currency, product.discount.value)
                          : '—'}
                      </td>

                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={rowBusy}
                          onClick={() => handleToggleActive(product)}
                          className={`border px-2 py-1 text-[12px] font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            product.isActive
                              ? 'border-green-600 text-green-700 hover:bg-green-50'
                              : 'border-neutral-300 text-neutral-500 hover:bg-neutral-100'
                          }`}
                        >
                          {product.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      <td className="px-4 py-3 text-neutral-500">{product.purchaseCount}</td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openPriceEdit(product)}
                            title="Edit price"
                            className="flex h-8 w-8 items-center justify-center text-neutral-600 hover:bg-neutral-100"
                          >
                            <Tag size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(product)}
                            title="Edit product"
                            className="flex h-8 w-8 items-center justify-center text-neutral-600 hover:bg-neutral-100"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            disabled={rowBusy}
                            onClick={() => handleDelete(product)}
                            title="Delete"
                            className="flex h-8 w-8 items-center justify-center text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CREATE / EDIT MODAL ── */}
      {formOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-neutral-200 bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[16px] font-medium">
                {editingId ? 'Edit product' : 'New product'}
              </h2>
              <button type="button" onClick={closeForm} className="text-neutral-500 hover:text-neutral-900">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-neutral-700">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((f) => ({
                      ...f,
                      name,
                      slug: f.slugTouched ? f.slug : slugify(name),
                    }));
                  }}
                  className="h-10 w-full border border-neutral-300 px-3 text-[13px] outline-none focus:border-neutral-900"
                  placeholder="First Met Map"
                />
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-medium text-neutral-700">Slug</label>
                <input
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, slug: e.target.value, slugTouched: true }))
                  }
                  className="h-10 w-full border border-neutral-300 px-3 text-[13px] outline-none focus:border-neutral-900"
                  placeholder="first-met-map"
                />
                <p className="mt-1 text-[11px] text-neutral-400">
                  This must match MAP_PRODUCT_SLUG in FirstMetMap.tsx for the storefront to find it.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-medium text-neutral-700">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-neutral-300 px-3 py-2 text-[13px] outline-none focus:border-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-neutral-700">
                    Selling price
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.sellingPrice}
                    onChange={(e) => setForm((f) => ({ ...f, sellingPrice: e.target.value }))}
                    className="h-10 w-full border border-neutral-300 px-3 text-[13px] outline-none focus:border-neutral-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-neutral-700">
                    Cost price
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.costPrice}
                    onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))}
                    className="h-10 w-full border border-neutral-300 px-3 text-[13px] outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-medium text-neutral-700">Currency</label>
                <input
                  value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                  className="h-10 w-32 border border-neutral-300 px-3 text-[13px] outline-none focus:border-neutral-900"
                />
              </div>

              <DiscountFields form={form} setForm={setForm} withDates />

              <label className="flex items-center gap-2 text-[13px]">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                Active (visible for purchase)
              </label>

              {formError && <p className="text-[13px] text-red-600">{formError}</p>}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeForm}
                className="h-10 border border-neutral-300 px-4 text-[13px] font-medium hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={submitForm}
                className="h-10 bg-neutral-900 px-4 text-[13px] font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── QUICK PRICE MODAL ── */}
      {priceEditId && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm border border-neutral-200 bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[16px] font-medium">Edit price</h2>
              <button
                type="button"
                onClick={closePriceEdit}
                className="text-neutral-500 hover:text-neutral-900"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-neutral-700">
                    Selling price
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={priceForm.sellingPrice}
                    onChange={(e) =>
                      setPriceForm((f) => ({ ...f, sellingPrice: e.target.value }))
                    }
                    className="h-10 w-full border border-neutral-300 px-3 text-[13px] outline-none focus:border-neutral-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-neutral-700">
                    Cost price
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={priceForm.costPrice}
                    onChange={(e) => setPriceForm((f) => ({ ...f, costPrice: e.target.value }))}
                    className="h-10 w-full border border-neutral-300 px-3 text-[13px] outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-medium text-neutral-700">Currency</label>
                <input
                  value={priceForm.currency}
                  onChange={(e) => setPriceForm((f) => ({ ...f, currency: e.target.value }))}
                  className="h-10 w-32 border border-neutral-300 px-3 text-[13px] outline-none focus:border-neutral-900"
                />
              </div>

              <DiscountFields form={priceForm} setForm={setPriceForm} withDates={false} />

              {priceError && <p className="text-[13px] text-red-600">{priceError}</p>}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closePriceEdit}
                className="h-10 border border-neutral-300 px-4 text-[13px] font-medium hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={priceSaving}
                onClick={submitPriceEdit}
                className="h-10 bg-neutral-900 px-4 text-[13px] font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {priceSaving ? 'Saving…' : 'Save price'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* ─────────────────────── shared discount sub-form ─────────────────────── */

function DiscountFields({
  form,
  setForm,
  withDates,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  withDates: boolean;
}) {
  return (
    <div className="border border-neutral-200 p-3">
      <label className="mb-2 block text-[12px] font-medium text-neutral-700">Discount</label>

      <div className="flex gap-2">
        <select
          value={form.discountType}
          onChange={(e) =>
            setForm((f) => ({ ...f, discountType: e.target.value as FormState['discountType'] }))
          }
          className="h-10 border border-neutral-300 px-2 text-[13px] outline-none focus:border-neutral-900"
        >
          <option value="none">No discount</option>
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed amount</option>
        </select>

        <input
          type="number"
          min={0}
          disabled={form.discountType === 'none'}
          value={form.discountValue}
          onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
          placeholder={form.discountType === 'percentage' ? '% off' : 'Amount off'}
          className="h-10 flex-1 border border-neutral-300 px-3 text-[13px] outline-none focus:border-neutral-900 disabled:bg-neutral-50 disabled:text-neutral-400"
        />
      </div>

      {withDates && form.discountType !== 'none' && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[11px] text-neutral-500">Starts (optional)</label>
            <input
              type="date"
              value={form.discountStart}
              onChange={(e) => setForm((f) => ({ ...f, discountStart: e.target.value }))}
              className="h-9 w-full border border-neutral-300 px-2 text-[12px] outline-none focus:border-neutral-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-neutral-500">Ends (optional)</label>
            <input
              type="date"
              value={form.discountEnd}
              onChange={(e) => setForm((f) => ({ ...f, discountEnd: e.target.value }))}
              className="h-9 w-full border border-neutral-300 px-2 text-[12px] outline-none focus:border-neutral-900"
            />
          </div>
        </div>
      )}
    </div>
  );
}
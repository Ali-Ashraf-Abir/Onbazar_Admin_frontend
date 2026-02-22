"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL as string;

/* ─────────────────────── constants ─────────────────────── */

const ZILLAS = [
  "Dhaka","Gazipur","Manikganj","Munshiganj","Narayanganj","Narsingdi","Faridpur",
  "Gopalganj","Kishoreganj","Madaripur","Rajbari","Shariatpur","Tangail","Chittagong",
  "Cox's Bazar","Bandarban","Rangamati","Khagrachhari","Comilla","Brahmanbaria",
  "Chandpur","Feni","Lakshmipur","Noakhali","Rajshahi","Bogra","Joypurhat","Naogaon",
  "Natore","Chapainawabganj","Pabna","Sirajganj","Khulna","Bagerhat","Chuadanga",
  "Jessore","Jhenaidah","Kushtia","Magura","Meherpur","Narail","Satkhira","Barisal",
  "Barguna","Bhola","Jhalokati","Patuakhali","Pirojpur","Sylhet","Habiganj",
  "Moulvibazar","Sunamganj","Rangpur","Dinajpur","Gaibandha","Kurigram","Lalmonirhat",
  "Nilphamari","Panchagarh","Thakurgaon","Mymensingh","Jamalpur","Netrokona","Sherpur",
];

const THANAS = [
  "Adabor","Badda","Banani","Cantonment","Dhanmondi","Gulshan","Hazaribagh","Jatrabari",
  "Kafrul","Kalabagan","Khilgaon","Kotwali","Lalbagh","Mirpur","Mohammadpur","Motijheel",
  "Pallabi","Ramna","Sabujbagh","Shahbagh","Tejgaon","Uttara","Vatara","Wari",
  "Gazipur Sadar","Kaliakair","Kaliganj","Kapasia","Sreepur",
  "Araihazar","Narayanganj Sadar","Rupganj","Sonargaon",
  "Narsingdi Sadar","Belabo","Monohardi","Raipura","Shibpur",
  "Anwara","Banshkhali","Fatikchhari","Hathazari","Patiya","Rangunia","Raozan","Sitakunda",
  "Cox's Bazar Sadar","Chakaria","Kutubdia","Maheshkhali","Ramu","Teknaf","Ukhia",
  "Comilla Sadar","Barura","Burichang","Chandina","Daudkandi","Debidwar","Muradnagar",
  "Rajshahi Sadar","Bagha","Bagmara","Charghat","Godagari","Puthia","Tanore",
  "Bogra Sadar","Dhunat","Gabtali","Kahaloo","Sariakandi","Shibganj","Sonatola",
  "Khulna","Batiaghata","Dacope","Dumuria","Koyra","Paikgachha","Rupsa",
  "Jessore Sadar","Abhaynagar","Bagherpara","Jhikargachha","Keshabpur","Manirampur",
  "Sylhet Sadar","Balaganj","Beanibazar","Bishwanath","Golapganj","Gowainghat","Jaintiapur",
  "Rangpur Sadar","Badarganj","Gangachara","Kaunia","Mithapukur","Pirgachha","Taraganj",
  "Mymensingh Sadar","Bhaluka","Fulbaria","Gaffargaon","Gauripur","Muktagachha","Trishal",
  "Barisal Sadar","Agailjhara","Babuganj","Bakerganj","Gournadi","Hizla","Mehendiganj",
];

/* ─────────────────────── types ─────────────────────── */

interface Product { _id: string; name: string; slug: string; images: string[]; pricing: { sellingPrice: number; currency: string }; sizes: string[]; hasSize: boolean; discount?: any; effectivePrice?: number; }
interface Addon   { _id: string; name: string; image: string; price: number; currency: string; note?: string; description?: string; }

interface CartItem  { product: Product; size: string; quantity: number; }
interface CartAddon { addon: Addon; quantity: number; customerNote: string; }

type Step = "cart" | "delivery" | "billing" | "payment" | "review";

/* ─────────────────────── helpers ─────────────────────── */

function ep(product: Product): number {
  const sp = product.pricing.sellingPrice;
  const d  = product.discount;
  if (!d) return sp;
  const now = Date.now();
  if (d.startDate && new Date(d.startDate).getTime() > now) return sp;
  if (d.endDate   && new Date(d.endDate).getTime()   < now) return sp;
  if (d.type === "percentage") return sp * (1 - d.value / 100);
  if (d.type === "fixed")      return Math.max(0, sp - d.value);
  return sp;
}

function fmt(n: number, currency = "BDT") {
  return `${currency === "BDT" ? "৳" : currency} ${n.toFixed(2)}`;
}

const STEPS: Step[] = ["cart","delivery","billing","payment","review"];
const STEP_LABELS = { cart: "Cart", delivery: "Delivery", billing: "Billing", payment: "Payment", review: "Review" };

/* ═══════════════════════════════════════════════════════ */

export default function CreateOrderPage() {
  /* ── data ── */
  const [products, setProducts] = useState<Product[]>([]);
  const [addons,   setAddons]   = useState<Addon[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  /* ── cart ── */
  const [cartItems,  setCartItems]  = useState<CartItem[]>([]);
  const [cartAddons, setCartAddons] = useState<CartAddon[]>([]);

  /* ── step ── */
  const [step, setStep] = useState<Step>("cart");

  /* ── delivery ── */
  const [del, setDel] = useState({ fullName:"", phone:"", email:"", address:"", country:"Bangladesh", zilla:"", thana:"", note:"" });

  /* ── billing ── */
  const [sameAsDelivery, setSameAsDelivery] = useState(true);
  const [bil, setBil] = useState({ fullName:"", email:"", phone:"" });

  /* ── payment ── */
  const [payMethod,    setPayMethod]    = useState<"COD"|"Bkash">("COD");
  const [bkashPhone,  setBkashPhone]   = useState("");
  const [bkashTxn,    setBkashTxn]     = useState("");

  /* ── submit ── */
  const [loading,    setLoading]    = useState(false);
  const [orderDone,  setOrderDone]  = useState<any>(null);

  /* ─────────────────────── fetch ─────────────────────── */

  useEffect(() => {
    async function load() {
      setLoadingData(true);
      try {
        const [pr, ar] = await Promise.all([
          fetch(`${API}/products?isActive=true&limit=50`).then(r => r.json()),
          fetch(`${API}/addons?isActive=true&limit=50`).then(r => r.json()),
        ]);
        setProducts(pr.data || []);
        setAddons(ar.data   || []);
      } finally { setLoadingData(false); }
    }
    load();
  }, []);

  /* ─────────────────────── cart helpers ─────────────────────── */

  function addProduct(p: Product, size: string) {
    setCartItems(prev => {
      const exists = prev.find(i => i.product._id === p._id && i.size === size);
      if (exists) return prev.map(i => i.product._id === p._id && i.size === size ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product: p, size, quantity: 1 }];
    });
  }
  function removeCartItem(idx: number) { setCartItems(p => p.filter((_,i) => i !== idx)); }
  function updateCartQty(idx: number, q: number) { if (q < 1) return; setCartItems(p => p.map((i,n) => n === idx ? { ...i, quantity: q } : i)); }

  function toggleAddon(a: Addon) {
    setCartAddons(prev => {
      const exists = prev.find(ca => ca.addon._id === a._id);
      if (exists) return prev.filter(ca => ca.addon._id !== a._id);
      return [...prev, { addon: a, quantity: 1, customerNote: "" }];
    });
  }
  function updateAddonNote(id: string, note: string) { setCartAddons(p => p.map(a => a.addon._id === id ? { ...a, customerNote: note } : a)); }
  function updateAddonQty(id: string, q: number)     { if (q < 1) return; setCartAddons(p => p.map(a => a.addon._id === id ? { ...a, quantity: q } : a)); }

  /* ─────────────────────── totals ─────────────────────── */

  const itemsTotal  = cartItems.reduce((s, i) => s + ep(i.product) * i.quantity, 0);
  const addonsTotal = cartAddons.reduce((s, a) => s + a.addon.price * a.quantity, 0);
  const grandTotal  = itemsTotal + addonsTotal;

  /* ─────────────────────── step validation ─────────────────────── */

  function canProceed(): { ok: boolean; msg: string } {
    if (step === "cart") {
      if (cartItems.length === 0) return { ok: false, msg: "Add at least one product" };
      return { ok: true, msg: "" };
    }
    if (step === "delivery") {
      const { fullName, phone, email, address, zilla, thana } = del;
      if (!fullName || !phone || !email || !address || !zilla || !thana)
        return { ok: false, msg: "Please fill all required delivery fields" };
      return { ok: true, msg: "" };
    }
    if (step === "billing") {
      if (!sameAsDelivery && (!bil.fullName || !bil.email || !bil.phone))
        return { ok: false, msg: "Please fill all billing fields" };
      return { ok: true, msg: "" };
    }
    if (step === "payment") {
      if (payMethod === "Bkash" && (!bkashPhone || !bkashTxn))
        return { ok: false, msg: "Please enter Bkash phone and transaction ID" };
      return { ok: true, msg: "" };
    }
    return { ok: true, msg: "" };
  }

  function nextStep() {
    const { ok, msg } = canProceed();
    if (!ok) { alert(msg); return; }
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  }
  function prevStep() {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  }

  /* ─────────────────────── submit ─────────────────────── */

  async function handleSubmit() {
    setLoading(true);
    try {
      const body = {
        items: cartItems.map(i => ({ product: i.product._id, size: i.size || null, quantity: i.quantity })),
        addons: cartAddons.map(a => ({ addon: a.addon._id, quantity: a.quantity, customerNote: a.customerNote || null })),
        delivery: del,
        billing: sameAsDelivery
          ? { sameAsDelivery: true }
          : { sameAsDelivery: false, fullName: bil.fullName, email: bil.email, phone: bil.phone },
        payment: payMethod === "COD"
          ? { method: "COD" }
          : { method: "Bkash", bkash: { customerPhone: bkashPhone, transactionId: bkashTxn } },
      };
      const res  = await fetch(`${API}/orders`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { alert(data.message || "Failed to place order"); return; }
      setOrderDone(data.data);
    } finally { setLoading(false); }
  }

  /* ─────────────────────── product size picker state ─────────────────────── */
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});

  /* ═══════════════════════════════════════════════════════ */

  if (orderDone) return (
    <div style={{ fontFamily: "var(--font-body)", background: "var(--color-bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="as-card" style={{ maxWidth: 480, width: "100%", padding: "40px 36px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 26, marginBottom: 8 }}>Order Placed!</h2>
        <p style={{ color: "var(--color-subtle)", fontSize: 14, marginBottom: 20 }}>Your order number is</p>
        <div style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 700, background: "var(--color-surface-alt)", padding: "12px 20px", borderRadius: "var(--radius-md)", marginBottom: 24, letterSpacing: 1 }}>
          {orderDone.orderNumber}
        </div>
        <p style={{ fontSize: 13, color: "var(--color-subtle)", marginBottom: 28 }}>
          Total: <strong style={{ color: "var(--color-ink)" }}>{fmt(orderDone.pricing.subtotal, orderDone.pricing.currency)}</strong>
          {" · "}{orderDone.payment.method}
        </p>
        <a href={`/orders/track/${orderDone.orderNumber}`} className="as-btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>
          Track Order →
        </a>
      </div>
    </div>
  );

  const stepIdx    = STEPS.indexOf(step);
  const validation = canProceed();

  return (
    <>
      <style>{`
        /* ── stepper ── */
        .co-stepper { display: flex; align-items: center; gap: 0; margin-bottom: 32px; }
        .co-step { display: flex; align-items: center; gap: 8px; }
        .co-step-dot { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--color-border); background: var(--color-surface); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: var(--color-ghost); transition: all 0.2s; flex-shrink: 0; }
        .co-step-dot--active { border-color: var(--color-accent); background: var(--color-accent); color: var(--color-ink); }
        .co-step-dot--done   { border-color: #22c55e; background: #22c55e; color: #fff; }
        .co-step-label { font-size: 12px; font-weight: 600; color: var(--color-ghost); transition: color 0.2s; white-space: nowrap; }
        .co-step-label--active { color: var(--color-ink); }
        .co-step-line { flex: 1; height: 1.5px; background: var(--color-border); margin: 0 8px; min-width: 20px; }
        .co-step-line--done { background: #22c55e; }

        /* ── product pick card ── */
        .co-product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
        .co-product-card { border: 1.5px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; background: var(--color-surface); cursor: pointer; transition: all 0.15s; }
        .co-product-card:hover { border-color: var(--color-accent); box-shadow: 0 0 0 3px rgba(200,169,126,0.12); }
        .co-product-img { width: 100%; height: 120px; object-fit: cover; display: block; background: var(--color-surface-alt); }
        .co-product-body { padding: 10px 12px; }
        .co-product-name { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
        .co-product-price { font-size: 12px; color: var(--color-subtle); }
        .co-size-pills { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
        .co-size-pill { padding: 3px 9px; border-radius: var(--radius-pill); font-size: 11px; font-weight: 600; border: 1.5px solid var(--color-border); background: var(--color-input-bg); color: var(--color-subtle); cursor: pointer; transition: all 0.12s; }
        .co-size-pill--selected { border-color: var(--color-accent); background: rgba(200,169,126,0.12); color: var(--color-accent-dark); }
        .co-add-btn { width: 100%; margin-top: 8px; padding: 6px; border-radius: var(--radius-md); background: var(--color-ink); color: var(--color-header-text); font-size: 12px; font-weight: 700; font-family: var(--font-body); border: none; cursor: pointer; transition: opacity 0.15s; }
        .co-add-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        /* ── cart summary ── */
        .co-cart-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--color-border); }
        .co-cart-thumb { width: 48px; height: 48px; border-radius: var(--radius-sm); object-fit: cover; background: var(--color-surface-alt); flex-shrink: 0; }
        .co-cart-name { font-size: 13px; font-weight: 600; flex: 1; min-width: 0; }
        .co-cart-meta { font-size: 11px; color: var(--color-subtle); margin-top: 2px; }
        .co-qty-ctrl { display: flex; align-items: center; gap: 6px; }
        .co-qty-btn { width: 26px; height: 26px; border-radius: 50%; border: 1.5px solid var(--color-border); background: var(--color-input-bg); font-size: 14px; font-weight: 700; color: var(--color-ink); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.12s; font-family: var(--font-body); }
        .co-qty-btn:hover { border-color: var(--color-accent); }
        .co-qty-val { font-size: 13px; font-weight: 700; width: 24px; text-align: center; }

        /* ── addon card ── */
        .co-addon-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px,1fr)); gap: 10px; }
        .co-addon-card { border: 1.5px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; background: var(--color-surface); transition: all 0.15s; }
        .co-addon-card--selected { border-color: var(--color-accent); background: rgba(200,169,126,0.05); }
        .co-addon-img { width: 100%; height: 90px; object-fit: cover; background: var(--color-surface-alt); display: block; }
        .co-addon-body { padding: 8px 10px; }
        .co-addon-name { font-size: 12px; font-weight: 600; margin-bottom: 2px; }
        .co-addon-price { font-size: 11px; color: var(--color-subtle); }
        .co-addon-note { font-size: 11px; color: var(--color-ghost); font-style: italic; margin-top: 3px; }
        .co-addon-toggle { width: 100%; margin-top: 6px; padding: 5px; border-radius: var(--radius-sm); font-size: 11px; font-weight: 700; font-family: var(--font-body); border: 1.5px solid var(--color-border); background: var(--color-input-bg); color: var(--color-subtle); cursor: pointer; transition: all 0.12s; }
        .co-addon-toggle--selected { background: var(--color-accent); color: var(--color-ink); border-color: var(--color-accent); }

        /* ── form fields ── */
        .co-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 600px) { .co-form-grid { grid-template-columns: 1fr; } }
        .co-form-full { grid-column: 1 / -1; }

        /* ── payment cards ── */
        .co-pay-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
        .co-pay-card { padding: 16px; border-radius: var(--radius-md); border: 2px solid var(--color-border); background: var(--color-input-bg); cursor: pointer; transition: all 0.15s; text-align: center; }
        .co-pay-card--active { border-color: var(--color-accent); background: rgba(200,169,126,0.06); }
        .co-pay-icon { font-size: 28px; margin-bottom: 6px; }
        .co-pay-label { font-size: 14px; font-weight: 700; }
        .co-pay-sub { font-size: 11px; color: var(--color-subtle); margin-top: 3px; }

        /* ── totals ── */
        .co-totals { background: var(--color-surface-alt); border-radius: var(--radius-md); border: 1.5px solid var(--color-border); overflow: hidden; }
        .co-total-row { display: flex; justify-content: space-between; padding: 9px 14px; font-size: 13px; border-bottom: 1px solid color-mix(in srgb, var(--color-border) 60%, transparent); }
        .co-total-row:last-child { border-bottom: none; font-weight: 700; font-size: 15px; }
        .co-total-label { color: var(--color-subtle); }
        .co-total-val   { font-weight: 600; color: var(--color-ink); font-variant-numeric: tabular-nums; }

        /* ── review ── */
        .co-review-section { background: var(--color-surface-alt); border: 1.5px solid var(--color-border); border-radius: var(--radius-md); padding: 16px; margin-bottom: 14px; }
        .co-review-title { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-ghost); margin-bottom: 10px; }
        .co-review-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px; }
        .co-review-label { color: var(--color-subtle); }
        .co-review-val   { font-weight: 600; color: var(--color-ink); text-align: right; max-width: 60%; }

        /* ── billing same toggle ── */
        .co-billing-choice { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
        .co-billing-btn { padding: 12px; border-radius: var(--radius-md); border: 2px solid var(--color-border); background: var(--color-input-bg); cursor: pointer; font-size: 13px; font-weight: 600; font-family: var(--font-body); color: var(--color-ghost); transition: all 0.15s; text-align: center; }
        .co-billing-btn--active { border-color: var(--color-accent); color: var(--color-accent-dark); background: rgba(200,169,126,0.08); }

        /* ── nav ── */
        .co-nav { display: flex; justify-content: space-between; align-items: center; margin-top: 28px; }
        .co-nav-back { background: none; border: 1.5px solid var(--color-border); border-radius: var(--radius-md); padding: 10px 20px; font-family: var(--font-body); font-size: 13px; font-weight: 600; color: var(--color-subtle); cursor: pointer; transition: all 0.15s; }
        .co-nav-back:hover { border-color: var(--color-ink); color: var(--color-ink); }
      `}</style>

      <div style={{ fontFamily: "var(--font-body)", background: "var(--color-bg)", minHeight: "100vh", color: "var(--color-ink)" }}>
        <header className="as-header">
          <span className="as-header-brand">Admin Studio</span>
          <span style={{ fontSize: 13, color: "var(--color-subtle)" }}>Test Order Creation</span>
        </header>

        <div className="as-body" style={{ maxWidth: 860 }}>
          <div className="as-title-row">
            <h1 className="as-title">Create Test Order</h1>
            <span className="as-title-sub">Simulate a customer order end-to-end</span>
          </div>

          {/* ── Stepper ── */}
          <div className="co-stepper">
            {STEPS.map((s, i) => (
              <>
                <div key={s} className="co-step">
                  <div className={`co-step-dot ${i < stepIdx ? "co-step-dot--done" : i === stepIdx ? "co-step-dot--active" : ""}`}>
                    {i < stepIdx ? "✓" : i + 1}
                  </div>
                  <span className={`co-step-label ${i === stepIdx ? "co-step-label--active" : ""}`}>{STEP_LABELS[s]}</span>
                </div>
                {i < STEPS.length - 1 && <div key={`line-${i}`} className={`co-step-line ${i < stepIdx ? "co-step-line--done" : ""}`} />}
              </>
            ))}
          </div>

          {/* ══════════ STEP: CART ══════════ */}
          {step === "cart" && (
            <div>
              {/* Products */}
              <div className="as-card" style={{ marginBottom: 16 }}>
                <div className="as-card-header">
                  <div className="as-card-title"><div className="as-card-title-icon">📦</div>Products</div>
                </div>
                <div className="as-card-body">
                  {loadingData ? (
                    <div style={{ color: "var(--color-subtle)", fontSize: 13 }}>Loading products…</div>
                  ) : (
                    <div className="co-product-grid">
                      {products.map(p => {
                        const price = ep(p);
                        const hasD  = price < p.pricing.sellingPrice;
                        return (
                          <div key={p._id} className="co-product-card">
                            {p.images?.[0]
                              ? <img src={p.images[0]} alt={p.name} className="co-product-img" />
                              : <div className="co-product-img" style={{ display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,opacity:0.3 }}>📷</div>
                            }
                            <div className="co-product-body">
                              <div className="co-product-name">{p.name}</div>
                              <div className="co-product-price">
                                {fmt(price, p.pricing.currency)}
                                {hasD && <span style={{ textDecoration:"line-through", color:"var(--color-ghost)", marginLeft:6, fontSize:11 }}>{fmt(p.pricing.sellingPrice, p.pricing.currency)}</span>}
                              </div>
                              {p.hasSize && p.sizes?.length > 0 && (
                                <div className="co-size-pills">
                                  {p.sizes.map(s => (
                                    <button key={s} type="button"
                                      className={`co-size-pill ${selectedSizes[p._id] === s ? "co-size-pill--selected" : ""}`}
                                      onClick={() => setSelectedSizes(prev => ({ ...prev, [p._id]: s }))}>
                                      {s}
                                    </button>
                                  ))}
                                </div>
                              )}
                              <button type="button" className="co-add-btn"
                                disabled={p.hasSize && !selectedSizes[p._id]}
                                onClick={() => addProduct(p, p.hasSize ? selectedSizes[p._id] : "")}>
                                + Add to Order
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Addons */}
              {addons.length > 0 && (
                <div className="as-card" style={{ marginBottom: 16 }}>
                  <div className="as-card-header">
                    <div className="as-card-title"><div className="as-card-title-icon">🎁</div>Add-ons</div>
                    <span style={{ fontSize: 12, color: "var(--color-subtle)" }}>Optional</span>
                  </div>
                  <div className="as-card-body">
                    <div className="co-addon-grid">
                      {addons.map(a => {
                        const selected = cartAddons.find(ca => ca.addon._id === a._id);
                        return (
                          <div key={a._id} className={`co-addon-card ${selected ? "co-addon-card--selected" : ""}`}>
                            <img src={a.image} alt={a.name} className="co-addon-img" />
                            <div className="co-addon-body">
                              <div className="co-addon-name">{a.name}</div>
                              <div className="co-addon-price">{fmt(a.price, a.currency)}</div>
                              {a.note && <div className="co-addon-note">"{a.note}"</div>}
                              <button type="button"
                                className={`co-addon-toggle ${selected ? "co-addon-toggle--selected" : ""}`}
                                onClick={() => toggleAddon(a)}>
                                {selected ? "✓ Added" : "+ Add"}
                              </button>
                              {selected && a.note && (
                                <textarea className="as-input as-textarea" style={{ marginTop:8, minHeight:56, fontSize:12 }}
                                  placeholder={a.note}
                                  value={selected.customerNote}
                                  onChange={e => updateAddonNote(a._id, e.target.value)} />
                              )}
                              {selected && (
                                <div className="co-qty-ctrl" style={{ marginTop:8 }}>
                                  <button type="button" className="co-qty-btn" onClick={() => updateAddonQty(a._id, selected.quantity - 1)}>−</button>
                                  <span className="co-qty-val">{selected.quantity}</span>
                                  <button type="button" className="co-qty-btn" onClick={() => updateAddonQty(a._id, selected.quantity + 1)}>+</button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Cart summary */}
              {cartItems.length > 0 && (
                <div className="as-card" style={{ marginBottom: 16 }}>
                  <div className="as-card-header">
                    <div className="as-card-title"><div className="as-card-title-icon">🛒</div>Order Summary</div>
                    <span style={{ fontSize: 12, color: "var(--color-subtle)" }}>{cartItems.length} item{cartItems.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="as-card-body">
                    {cartItems.map((item, idx) => (
                      <div key={idx} className="co-cart-row">
                        {item.product.images?.[0]
                          ? <img src={item.product.images[0]} alt="" className="co-cart-thumb" />
                          : <div className="co-cart-thumb" style={{ display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,opacity:0.3 }}>📷</div>
                        }
                        <div style={{ flex:1, minWidth:0 }}>
                          <div className="co-cart-name">{item.product.name}</div>
                          <div className="co-cart-meta">{item.size && `Size: ${item.size} · `}{fmt(ep(item.product), item.product.pricing.currency)} each</div>
                        </div>
                        <div className="co-qty-ctrl">
                          <button type="button" className="co-qty-btn" onClick={() => updateCartQty(idx, item.quantity - 1)}>−</button>
                          <span className="co-qty-val">{item.quantity}</span>
                          <button type="button" className="co-qty-btn" onClick={() => updateCartQty(idx, item.quantity + 1)}>+</button>
                        </div>
                        <div style={{ fontWeight:700, fontSize:14, minWidth:64, textAlign:"right" }}>{fmt(ep(item.product)*item.quantity, item.product.pricing.currency)}</div>
                        <button type="button" className="as-btn-remove" onClick={() => removeCartItem(idx)}>✕</button>
                      </div>
                    ))}
                    <div className="co-totals" style={{ marginTop:16 }}>
                      <div className="co-total-row"><span className="co-total-label">Items</span><span className="co-total-val">{fmt(itemsTotal)}</span></div>
                      {addonsTotal > 0 && <div className="co-total-row"><span className="co-total-label">Add-ons</span><span className="co-total-val">{fmt(addonsTotal)}</span></div>}
                      <div className="co-total-row"><span className="co-total-label">Total</span><span className="co-total-val">{fmt(grandTotal)}</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════ STEP: DELIVERY ══════════ */}
          {step === "delivery" && (
            <div className="as-card">
              <div className="as-card-header">
                <div className="as-card-title"><div className="as-card-title-icon">🚚</div>Delivery Information</div>
              </div>
              <div className="as-card-body">
                <div className="co-form-grid">
                  <div className="as-field">
                    <label className="as-label">Full Name <span style={{ color:"#ef4444" }}>*</span></label>
                    <input className="as-input" value={del.fullName} onChange={e => setDel(p => ({ ...p, fullName: e.target.value }))} placeholder="Customer full name" />
                  </div>
                  <div className="as-field">
                    <label className="as-label">Phone <span style={{ color:"#ef4444" }}>*</span></label>
                    <input className="as-input" value={del.phone} onChange={e => setDel(p => ({ ...p, phone: e.target.value }))} placeholder="01XXXXXXXXX" />
                  </div>
                  <div className="as-field co-form-full">
                    <label className="as-label">Email <span style={{ color:"#ef4444" }}>*</span></label>
                    <input className="as-input" type="email" value={del.email} onChange={e => setDel(p => ({ ...p, email: e.target.value }))} placeholder="customer@email.com" />
                  </div>
                  <div className="as-field co-form-full">
                    <label className="as-label">Address <span style={{ color:"#ef4444" }}>*</span></label>
                    <input className="as-input" value={del.address} onChange={e => setDel(p => ({ ...p, address: e.target.value }))} placeholder="House, Road, Area" />
                  </div>
                  <div className="as-field">
                    <label className="as-label">Zilla <span style={{ color:"#ef4444" }}>*</span></label>
                    <select className="as-select" style={{ width:"100%" }} value={del.zilla} onChange={e => setDel(p => ({ ...p, zilla: e.target.value }))}>
                      <option value="">Select Zilla…</option>
                      {ZILLAS.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                  <div className="as-field">
                    <label className="as-label">Thana <span style={{ color:"#ef4444" }}>*</span></label>
                    <select className="as-select" style={{ width:"100%" }} value={del.thana} onChange={e => setDel(p => ({ ...p, thana: e.target.value }))}>
                      <option value="">Select Thana…</option>
                      {THANAS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="as-field">
                    <label className="as-label">Country</label>
                    <input className="as-input" value="Bangladesh" disabled style={{ opacity:0.6 }} />
                  </div>
                  <div className="as-field">
                    <label className="as-label">Delivery Note <span style={{ color:"var(--color-ghost)", fontWeight:400, textTransform:"none" }}>(optional)</span></label>
                    <input className="as-input" value={del.note} onChange={e => setDel(p => ({ ...p, note: e.target.value }))} placeholder="Any special instructions…" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════ STEP: BILLING ══════════ */}
          {step === "billing" && (
            <div className="as-card">
              <div className="as-card-header">
                <div className="as-card-title"><div className="as-card-title-icon">🧾</div>Billing Information</div>
              </div>
              <div className="as-card-body">
                <div className="co-billing-choice">
                  <button type="button" className={`co-billing-btn ${sameAsDelivery ? "co-billing-btn--active" : ""}`} onClick={() => setSameAsDelivery(true)}>
                    ✓ Same as Delivery
                  </button>
                  <button type="button" className={`co-billing-btn ${!sameAsDelivery ? "co-billing-btn--active" : ""}`} onClick={() => setSameAsDelivery(false)}>
                    + Different Person
                  </button>
                </div>
                {sameAsDelivery ? (
                  <div style={{ padding:"14px", background:"var(--color-surface-alt)", borderRadius:"var(--radius-md)", border:"1.5px solid var(--color-border)", fontSize:13, color:"var(--color-subtle)" }}>
                    Billing contact will use <strong style={{ color:"var(--color-ink)" }}>{del.email}</strong> and <strong style={{ color:"var(--color-ink)" }}>{del.phone}</strong> from delivery info.
                  </div>
                ) : (
                  <div className="co-form-grid">
                    <div className="as-field co-form-full">
                      <label className="as-label">Full Name <span style={{ color:"#ef4444" }}>*</span></label>
                      <input className="as-input" value={bil.fullName} onChange={e => setBil(p => ({ ...p, fullName: e.target.value }))} placeholder="Billing contact name" />
                    </div>
                    <div className="as-field">
                      <label className="as-label">Email <span style={{ color:"#ef4444" }}>*</span></label>
                      <input className="as-input" type="email" value={bil.email} onChange={e => setBil(p => ({ ...p, email: e.target.value }))} placeholder="billing@email.com" />
                    </div>
                    <div className="as-field">
                      <label className="as-label">Phone <span style={{ color:"#ef4444" }}>*</span></label>
                      <input className="as-input" value={bil.phone} onChange={e => setBil(p => ({ ...p, phone: e.target.value }))} placeholder="01XXXXXXXXX" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════ STEP: PAYMENT ══════════ */}
          {step === "payment" && (
            <div className="as-card">
              <div className="as-card-header">
                <div className="as-card-title"><div className="as-card-title-icon">💳</div>Payment Method</div>
              </div>
              <div className="as-card-body">
                <div className="co-pay-cards">
                  <div className={`co-pay-card ${payMethod === "COD" ? "co-pay-card--active" : ""}`} onClick={() => setPayMethod("COD")}>
                    <div className="co-pay-icon">💵</div>
                    <div className="co-pay-label">Cash on Delivery</div>
                    <div className="co-pay-sub">Pay when you receive</div>
                  </div>
                  <div className={`co-pay-card ${payMethod === "Bkash" ? "co-pay-card--active" : ""}`} onClick={() => setPayMethod("Bkash")}>
                    <div className="co-pay-icon">📱</div>
                    <div className="co-pay-label">Bkash</div>
                    <div className="co-pay-sub">Mobile banking payment</div>
                  </div>
                </div>
                {payMethod === "Bkash" && (
                  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    <div className="as-field" style={{ marginBottom:0 }}>
                      <label className="as-label">Bkash Phone Number <span style={{ color:"#ef4444" }}>*</span></label>
                      <input className="as-input" value={bkashPhone} onChange={e => setBkashPhone(e.target.value)} placeholder="01XXXXXXXXX" />
                    </div>
                    <div className="as-field" style={{ marginBottom:0 }}>
                      <label className="as-label">Transaction ID <span style={{ color:"#ef4444" }}>*</span></label>
                      <input className="as-input" value={bkashTxn} onChange={e => setBkashTxn(e.target.value)} placeholder="e.g. 8N6YJU9K2L" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════ STEP: REVIEW ══════════ */}
          {step === "review" && (
            <div>
              <div className="co-review-section">
                <div className="co-review-title">Order Items</div>
                {cartItems.map((item, i) => (
                  <div key={i} className="co-review-row">
                    <span className="co-review-label">{item.product.name}{item.size ? ` (${item.size})` : ""} × {item.quantity}</span>
                    <span className="co-review-val">{fmt(ep(item.product) * item.quantity)}</span>
                  </div>
                ))}
                {cartAddons.map((a, i) => (
                  <div key={i} className="co-review-row">
                    <span className="co-review-label">🎁 {a.addon.name} × {a.quantity}</span>
                    <span className="co-review-val">{fmt(a.addon.price * a.quantity)}</span>
                  </div>
                ))}
                <div className="co-review-row" style={{ marginTop:8, paddingTop:8, borderTop:"1px solid var(--color-border)", fontWeight:700 }}>
                  <span>Total</span>
                  <span>{fmt(grandTotal)}</span>
                </div>
              </div>
              <div className="co-review-section">
                <div className="co-review-title">Delivery</div>
                <div className="co-review-row"><span className="co-review-label">Name</span><span className="co-review-val">{del.fullName}</span></div>
                <div className="co-review-row"><span className="co-review-label">Phone</span><span className="co-review-val">{del.phone}</span></div>
                <div className="co-review-row"><span className="co-review-label">Email</span><span className="co-review-val">{del.email}</span></div>
                <div className="co-review-row"><span className="co-review-label">Address</span><span className="co-review-val">{del.address}, {del.thana}, {del.zilla}</span></div>
              </div>
              <div className="co-review-section">
                <div className="co-review-title">Payment</div>
                <div className="co-review-row"><span className="co-review-label">Method</span><span className="co-review-val">{payMethod}</span></div>
                {payMethod === "Bkash" && <>
                  <div className="co-review-row"><span className="co-review-label">Bkash Phone</span><span className="co-review-val">{bkashPhone}</span></div>
                  <div className="co-review-row"><span className="co-review-label">Transaction ID</span><span className="co-review-val">{bkashTxn}</span></div>
                </>}
              </div>
            </div>
          )}

          {/* ── Navigation ── */}
          <div className="co-nav">
            <button type="button" className="co-nav-back" onClick={prevStep} style={{ visibility: stepIdx === 0 ? "hidden" : "visible" }}>
              ← Back
            </button>
            {step !== "review" ? (
              <button type="button" className="as-btn-primary" onClick={nextStep}>
                Continue →
              </button>
            ) : (
              <button type="button" className="as-btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? <><span className="as-spinner" />Placing…</> : "Place Order →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
"use client";

import { useEffect, useState, useRef } from "react";
import type { PromoApplyResult } from "@/types/promo";

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

const DHAKA_OUTER_THANAS = new Set(["Dhamrai", "Dohar", "Keraniganj", "Nawabganj", "Savar"]);

const THANAS_BY_ZILLA: Record<string, string[]> = {
  "Dhaka": ["Adabor","Badda","Banani","Bangshal","Cantonment","Chawkbazar","Dakshinkhan","Darus Salam","Demra","Dhanmondi","Gendaria","Gulshan","Hazaribagh","Jatrabari","Kadamtali","Kafrul","Kalabagan","Kamrangirchar","Khilgaon","Khilkhet","Kotwali","Lalbagh","Mirpur","Mohammadpur","Motijheel","Mugda","Nawabganj","New Market","Pallabi","Paltan","Ramna","Rayer Bazar","Sabujbagh","Shah Ali","Shahbagh","Sher-e-Bangla Nagar","Shyampur","Sutrapur","Tejgaon","Turag","Uttara","Uttarkhan","Vatara","Wari","Dhamrai","Dohar","Keraniganj","Savar"],
  "Gazipur": ["Gazipur Sadar","Kaliakair","Kaliganj","Kapasia","Sreepur"],
  "Manikganj": ["Daulatpur","Ghior","Harirampur","Manikganj Sadar","Saturia","Shivalaya","Singair"],
  "Munshiganj": ["Gazaria","Lohajang","Munshiganj Sadar","Sirajdikhan","Sreenagar","Tongibari"],
  "Narayanganj": ["Araihazar","Bandar","Narayanganj Sadar","Rupganj","Sonargaon"],
  "Narsingdi": ["Belabo","Monohardi","Narsingdi Sadar","Palash","Raipura","Shibpur"],
  "Faridpur": ["Alfadanga","Bhanga","Boalmari","Charbhadrasan","Faridpur Sadar","Madhukhali","Nagarkanda","Sadarpur","Saltha"],
  "Gopalganj": ["Gopalganj Sadar","Kashiani","Kotalipara","Muksudpur","Tungipara"],
  "Kishoreganj": ["Austagram","Bajitpur","Bhairab","Hossainpur","Itna","Karimganj","Katiadi","Kishoreganj Sadar","Kuliarchar","Mithamain","Nikli","Pakundia","Tarail"],
  "Madaripur": ["Kalkini","Madaripur Sadar","Rajoir","Shibchar"],
  "Rajbari": ["Baliakandi","Goalandaghat","Kalukhali","Pangsha","Rajbari Sadar"],
  "Shariatpur": ["Bhedarganj","Damudya","Gosairhat","Naria","Shariatpur Sadar","Zanjira"],
  "Tangail": ["Basail","Bhuapur","Delduar","Dhanbari","Ghatail","Gopalpur","Kalihati","Madhupur","Mirzapur","Nagarpur","Sakhipur","Tangail Sadar"],
  "Chittagong": ["Anwara","Banshkhali","Boalkhali","Chandanaish","Fatikchhari","Hathazari","Karnaphuli","Lohagara","Mirsharai","Patiya","Rangunia","Raozan","Sandwip","Satkania","Sitakunda","Bakalia","Bayazid","Chandgaon","Chittagong Port","Double Mooring","EPZ","Khulshi","Kotwali","Pahartali","Panchlaish","Patenga"],
  "Cox's Bazar": ["Chakaria","Cox's Bazar Sadar","Kutubdia","Maheshkhali","Pekua","Ramu","Teknaf","Ukhia"],
  "Bandarban": ["Ali Kadam","Bandarban Sadar","Lama","Naikhongchhari","Rowangchhari","Ruma","Thanchi"],
  "Rangamati": ["Bagaichhari","Barkal","Belaichhari","Juraichhari","Kaptai","Kaukhali","Langadu","Naniarchar","Rajasthali","Rangamati Sadar"],
  "Khagrachhari": ["Dighinala","Khagrachhari Sadar","Lakshmichhari","Mahalchhari","Manikchhari","Matiranga","Panchhari","Ramgarh"],
  "Comilla": ["Barura","Brahmanpara","Burichang","Chandina","Chauddagram","Comilla Sadar","Comilla Sadar South","Daudkandi","Debidwar","Homna","Laksam","Lalmai","Meghna","Monohorgonj","Muradnagar","Nangalkot","Titas"],
  "Brahmanbaria": ["Akhaura","Ashuganj","Bancharampur","Brahmanbaria Sadar","Kasba","Nabinagar","Nasirnagar","Sarail"],
  "Chandpur": ["Chandpur Sadar","Faridganj","Haimchar","Hajiganj","Kachua","Matlab North","Matlab South","Shahrasti"],
  "Feni": ["Chhagalnaiya","Daganbhuiyan","Feni Sadar","Parshuram","Sonagazi","Fulgazi"],
  "Lakshmipur": ["Kamalnagar","Lakshmipur Sadar","Ramganj","Ramgati","Raipur"],
  "Noakhali": ["Begumganj","Chatkhil","Companiganj","Hatiya","Kabirhat","Noakhali Sadar","Senbagh","Sonaimuri","Subarnachar"],
  "Rajshahi": ["Bagha","Bagmara","Charghat","Durgapur","Godagari","Mohanpur","Paba","Puthia","Tanore","Boalia","Matihar","Rajpara","Shah Makhdum"],
  "Bogra": ["Adamdighi","Bogra Sadar","Dhunat","Dhupchanchia","Gabtali","Kahaloo","Nandigram","Sariakandi","Shajahanpur","Sherpur","Shibganj","Sonatola"],
  "Joypurhat": ["Akkelpur","Joypurhat Sadar","Kalai","Khetlal","Panchbibi"],
  "Naogaon": ["Atrai","Badalgachhi","Dhamoirhat","Manda","Mahadebpur","Naogaon Sadar","Niamatpur","Patnitala","Porsha","Raninagar","Sapahar"],
  "Natore": ["Bagatipara","Baraigram","Gurudaspur","Lalpur","Natore Sadar","Singra"],
  "Chapainawabganj": ["Bholahat","Chapainawabganj Sadar","Gomastapur","Nachole","Shibganj"],
  "Pabna": ["Atgharia","Bera","Bhangura","Chatmohar","Faridpur","Ishwardi","Pabna Sadar","Santhia","Sujanagar"],
  "Sirajganj": ["Belkuchi","Chauhali","Kamarkhanda","Kazipur","Raiganj","Shahjadpur","Sirajganj Sadar","Tarash","Ullapara"],
  "Khulna": ["Batiaghata","Dacope","Dumuria","Dighalia","Koyra","Paikgachha","Phultala","Rupsa","Terokhada","Daulatpur","Khalishpur","Khan Jahan Ali","Khulna Sadar","Sonadanga"],
  "Bagerhat": ["Bagerhat Sadar","Chitalmari","Fakirhat","Kachua","Mollahat","Mongla","Morrelganj","Rampal","Sarankhola"],
  "Chuadanga": ["Alamdanga","Chuadanga Sadar","Damurhuda","Jibannagar"],
  "Jessore": ["Abhaynagar","Bagherpara","Chaugachha","Jhikargachha","Jessore Sadar","Keshabpur","Manirampur","Sharsha"],
  "Jhenaidah": ["Harinakunda","Jhenaidah Sadar","Kaliganj","Kotchandpur","Maheshpur","Shailkupa"],
  "Kushtia": ["Bheramara","Daulatpur","Khoksa","Kumarkhali","Kushtia Sadar","Mirpur"],
  "Magura": ["Magura Sadar","Mohammadpur","Shalikha","Sreepur"],
  "Meherpur": ["Gangni","Meherpur Sadar","Mujibnagar"],
  "Narail": ["Kalia","Lohagara","Narail Sadar"],
  "Satkhira": ["Assasuni","Debhata","Kalaroa","Kaliganj","Satkhira Sadar","Shyamnagar","Tala"],
  "Barisal": ["Agailjhara","Babuganj","Bakerganj","Banaripara","Gaurnadi","Hizla","Mehendiganj","Muladi","Wazirpur","Barisal Sadar","Airport","Banda","Kawnia"],
  "Barguna": ["Amtali","Bamna","Barguna Sadar","Betagi","Patharghata","Taltali"],
  "Bhola": ["Bhola Sadar","Burhanuddin","Char Fasson","Daulatkhan","Lalmohan","Manpura","Tazumuddin"],
  "Jhalokati": ["Jhalokati Sadar","Kathalia","Nalchity","Rajapur"],
  "Patuakhali": ["Bauphal","Dashmina","Dumki","Galachipa","Kalapara","Mirzaganj","Patuakhali Sadar","Rangabali"],
  "Pirojpur": ["Bhandaria","Kawkhali","Mathbaria","Nazirpur","Pirojpur Sadar","Nesarabad","Zianagar"],
  "Sylhet": ["Balaganj","Beanibazar","Bishwanath","Companiganj","Dakshin Surma","Fenchuganj","Golapganj","Gowainghat","Jaintiapur","Kanaighat","Osmani Nagar","Zakiganj","Sylhet Sadar","Shahporan","Moglabazar"],
  "Habiganj": ["Ajmiriganj","Bahubal","Baniachong","Chunarughat","Habiganj Sadar","Lakhai","Madhabpur","Nabiganj","Shayestaganj"],
  "Moulvibazar": ["Barlekha","Juri","Kamalganj","Kulaura","Moulvibazar Sadar","Rajnagar","Sreemangal"],
  "Sunamganj": ["Bishwamvarpur","Chhatak","Derai","Dharampasha","Dowarabazar","Jagannathpur","Jamalganj","Sullah","Sunamganj Sadar","South Sunamganj","Tahirpur"],
  "Rangpur": ["Badarganj","Gangachara","Kaunia","Mithapukur","Pirgachha","Pirganj","Taraganj","Rangpur Sadar","Kotwali"],
  "Dinajpur": ["Birampur","Birganj","Biral","Bochaganj","Chirirbandar","Dinajpur Sadar","Fulbari","Ghoraghat","Hakimpur","Kaharole","Khansama","Nawabganj","Parbatipur"],
  "Gaibandha": ["Fulchhari","Gaibandha Sadar","Gobindaganj","Palashbari","Sadullapur","Saghata","Sundarganj"],
  "Kurigram": ["Bhurungamari","Char Rajibpur","Chilmari","Kurigram Sadar","Nageshwari","Phulbari","Rajarhat","Raumari","Ulipur"],
  "Lalmonirhat": ["Aditmari","Hatibandha","Kaliganj","Lalmonirhat Sadar","Patgram"],
  "Nilphamari": ["Dimla","Domar","Jaldhaka","Kishoreganj","Nilphamari Sadar","Saidpur"],
  "Panchagarh": ["Atwari","Boda","Debiganj","Panchagarh Sadar","Tetulia"],
  "Thakurgaon": ["Baliadangi","Haripur","Pirganj","Ranisankail","Thakurgaon Sadar"],
  "Mymensingh": ["Bhaluka","Dhobaura","Fulbaria","Gaffargaon","Gauripur","Haluaghat","Ishwarganj","Muktagachha","Mymensingh Sadar","Nandail","Phulpur","Trishal"],
  "Jamalpur": ["Bakshiganj","Dewanganj","Islampur","Jamalpur Sadar","Madarganj","Melandaha","Sarishabari"],
  "Netrokona": ["Atpara","Barhatta","Durgapur","Kalmakanda","Kendua","Khaliajuri","Madan","Mohanganj","Netrokona Sadar","Purbadhala"],
  "Sherpur": ["Jhenaigati","Nakla","Nalitabari","Sherpur Sadar","Sreebardi"],
};

/* ─────────────────────── helpers ─────────────────────── */

function calcDeliveryCharge(zilla: string, thana: string): number {
  if (!zilla || !thana) return 0;
  if (zilla === "Dhaka" && !DHAKA_OUTER_THANAS.has(thana)) return 60;
  return 120;
}

interface Product { _id: string; name: string; slug: string; images: string[]; pricing: { sellingPrice: number; currency: string }; sizes: string[]; hasSize: boolean; discount?: { type: string; value: number; startDate?: string; endDate?: string } }
interface Addon   { _id: string; name: string; image: string; price: number; currency: string; note?: string; description?: string; }
interface CartItem  { product: Product; size: string; quantity: number; }
interface CartAddon { addon: Addon; quantity: number; customerNote: string; }
type Step = "cart" | "delivery" | "billing" | "payment" | "review";

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

const STEPS: Step[] = ["cart", "delivery", "billing", "payment", "review"];
const STEP_LABELS: Record<Step, string> = { cart: "Cart", delivery: "Delivery", billing: "Billing", payment: "Payment", review: "Review" };

/* ─────────────────────── sub-components ─────────────────────── */

const inputCls = "w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 bg-white outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10";
const labelCls = "block text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5";
const selectCls = `${inputCls} appearance-none cursor-pointer`;

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ icon, title, right }: { icon: string; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
      <div className="flex items-center gap-2.5">
        <span className="text-base">{icon}</span>
        <span className="text-sm font-bold text-zinc-900 tracking-tight">{title}</span>
      </div>
      {right && <div className="text-xs text-zinc-400">{right}</div>}
    </div>
  );
}

function QtyControl({ value, onDec, onInc }: { value: number; onDec: () => void; onInc: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={onDec} className="w-7 h-7 rounded-full border border-zinc-200 bg-zinc-50 text-zinc-600 text-sm font-bold flex items-center justify-center hover:border-zinc-900 hover:bg-zinc-900 hover:text-white transition-all">−</button>
      <span className="w-6 text-center text-sm font-bold text-zinc-900">{value}</span>
      <button type="button" onClick={onInc} className="w-7 h-7 rounded-full border border-zinc-200 bg-zinc-50 text-zinc-600 text-sm font-bold flex items-center justify-center hover:border-zinc-900 hover:bg-zinc-900 hover:text-white transition-all">+</button>
    </div>
  );
}

/* ─────────────────────── promo code input component ─────────────────────── */

function PromoInput({
  subtotal,
  productIds,
  appliedPromo,
  onApply,
  onRemove,
}: {
  subtotal: number;
  productIds: string[];
  appliedPromo: PromoApplyResult | null;
  onApply: (result: PromoApplyResult) => void;
  onRemove: () => void;
}) {
  const [code, setCode] = useState(appliedPromo?.code ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // If a promo is already applied, show the success state directly
  if (appliedPromo) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-black text-emerald-800 tracking-widest" style={{ fontFamily: "monospace" }}>
                {appliedPromo.code}
              </p>
              <p className="text-[11px] text-emerald-600 mt-0.5">
                {appliedPromo.discountType === "percentage"
                  ? `${appliedPromo.discountValue}% off`
                  : `Fixed discount`} · You save {fmt(appliedPromo.discountAmount)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { onRemove(); setCode(""); setError(null); }}
            className="text-[11px] font-bold text-emerald-600 hover:text-red-500 transition-colors underline underline-offset-2"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  async function applyCode() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/promocodes/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: trimmed, subtotal, productIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Invalid promo code");
        return;
      }
      onApply(data.data as PromoApplyResult);
    } catch {
      setError("Could not validate promo code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            className={`${inputCls} uppercase tracking-widest font-mono text-sm`}
            placeholder="Enter promo code…"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(null); }}
            onKeyDown={(e) => e.key === "Enter" && applyCode()}
            spellCheck={false}
          />
        </div>
        <button
          type="button"
          onClick={applyCode}
          disabled={!code.trim() || loading}
          className="px-4 py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 whitespace-nowrap"
        >
          {loading ? (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : "Apply"}
        </button>
      </div>
      {error && (
        <p className="text-[11px] text-red-500 font-medium flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" strokeLinecap="round" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */

export default function CreateOrderPage() {
  const [products,       setProducts]       = useState<Product[]>([]);
  const [addons,         setAddons]         = useState<Addon[]>([]);
  const [loadingData,    setLoadingData]    = useState(true);
  const [cartItems,      setCartItems]      = useState<CartItem[]>([]);
  const [cartAddons,     setCartAddons]     = useState<CartAddon[]>([]);
  const [step,           setStep]           = useState<Step>("cart");
  const [del,            setDel]            = useState({ fullName: "", phone: "", email: "", address: "", country: "Bangladesh", zilla: "", thana: "", note: "" });
  const [sameAsDelivery, setSameAsDelivery] = useState(true);
  const [bil,            setBil]            = useState({ fullName: "", email: "", phone: "" });
  const [payMethod,      setPayMethod]      = useState<"COD" | "Bkash">("COD");
  const [bkashPhone,     setBkashPhone]     = useState("");
  const [bkashTxn,       setBkashTxn]      = useState("");
  const [loading,        setLoading]        = useState(false);
  const [orderDone,      setOrderDone]      = useState<any>(null);
  const [selectedSizes,  setSelectedSizes]  = useState<Record<string, string>>({});

  // ── promo state ──
  const [appliedPromo, setAppliedPromo] = useState<PromoApplyResult | null>(null);

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

  /* ── cart helpers ── */
  function addProduct(p: Product, size: string) {
    setCartItems(prev => {
      const exists = prev.find(i => i.product._id === p._id && i.size === size);
      if (exists) return prev.map(i => i.product._id === p._id && i.size === size ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product: p, size, quantity: 1 }];
    });
    // Invalidate promo when cart changes
    if (appliedPromo) setAppliedPromo(null);
  }
  function removeCartItem(idx: number) {
    setCartItems(p => p.filter((_, i) => i !== idx));
    if (appliedPromo) setAppliedPromo(null);
  }
  function updateCartQty(idx: number, q: number) {
    if (q < 1) return;
    setCartItems(p => p.map((i, n) => n === idx ? { ...i, quantity: q } : i));
    if (appliedPromo) setAppliedPromo(null);
  }
  function toggleAddon(a: Addon) {
    setCartAddons(prev => {
      const exists = prev.find(ca => ca.addon._id === a._id);
      if (exists) return prev.filter(ca => ca.addon._id !== a._id);
      return [...prev, { addon: a, quantity: 1, customerNote: "" }];
    });
    if (appliedPromo) setAppliedPromo(null);
  }
  function updateAddonNote(id: string, note: string) { setCartAddons(p => p.map(a => a.addon._id === id ? { ...a, customerNote: note } : a)); }
  function updateAddonQty(id: string, q: number)     { if (q < 1) return; setCartAddons(p => p.map(a => a.addon._id === id ? { ...a, quantity: q } : a)); }

  /* ── totals ── */
  const itemsSubtotal   = cartItems.reduce((s, i) => s + ep(i.product) * i.quantity, 0);
  const addonsSubtotal  = cartAddons.reduce((s, a) => s + a.addon.price * a.quantity, 0);
  const subtotalBeforePromo = itemsSubtotal + addonsSubtotal;
  const promoDiscount   = appliedPromo?.discountAmount ?? 0;
  const subtotal        = subtotalBeforePromo - promoDiscount;
  const deliveryCharge  = calcDeliveryCharge(del.zilla, del.thana);
  const grandTotal      = subtotal + deliveryCharge;

  const availableThanas: string[] = del.zilla ? (THANAS_BY_ZILLA[del.zilla] ?? []) : [];
  function handleZillaChange(zilla: string) { setDel(p => ({ ...p, zilla, thana: "" })); }
  const isInsideDhaka = del.zilla === "Dhaka" && del.thana && !DHAKA_OUTER_THANAS.has(del.thana);

  const cartProductIds = cartItems.map(i => i.product._id);

  function canProceed(): { ok: boolean; msg: string } {
    if (step === "cart" && cartItems.length === 0) return { ok: false, msg: "Add at least one product" };
    if (step === "delivery") {
      const { fullName, phone, email, address, zilla, thana } = del;
      if (!fullName || !phone || !email || !address || !zilla || !thana)
        return { ok: false, msg: "Please fill all required delivery fields" };
    }
    if (step === "billing" && !sameAsDelivery && (!bil.fullName || !bil.email || !bil.phone))
      return { ok: false, msg: "Please fill all billing fields" };
    if (step === "payment" && payMethod === "Bkash" && (!bkashPhone || !bkashTxn))
      return { ok: false, msg: "Please enter Bkash phone and transaction ID" };
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

  async function handleSubmit() {
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
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
      // Include promo code in payload if applied
      if (appliedPromo) body.promoCode = appliedPromo.code;

      const res  = await fetch(`${API}/orders`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { alert(data.message || "Failed to place order"); return; }
      setOrderDone(data.data);
    } finally { setLoading(false); }
  }

  /* ── success screen ── */
  if (orderDone) return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm max-w-md w-full p-10 text-center">
        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-zinc-900 mb-2 tracking-tight">Order Placed</h2>
        <p className="text-sm text-zinc-400 mb-6">Your test order has been created successfully</p>
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl px-6 py-4 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Order Number</p>
          <p className="font-mono text-xl font-black text-zinc-900 tracking-wider">{orderDone.orderNumber}</p>
        </div>
        {orderDone.promo && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-6 py-3 mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Promo Applied</p>
            <p className="font-mono text-sm font-black text-emerald-800">{orderDone.promo.code}</p>
            <p className="text-xs text-emerald-600 mt-0.5">Saved {fmt(orderDone.promo.discountAmount)}</p>
          </div>
        )}
        <div className="flex items-center justify-between text-sm mb-8 px-2">
          <span className="text-zinc-400">Total</span>
          <span className="font-bold text-zinc-900">{fmt(orderDone.pricing.grandTotal, orderDone.pricing.currency)}</span>
        </div>
        <a href={`/orders/track/${orderDone.orderNumber}`}
          className="block w-full bg-zinc-900 text-white text-sm font-bold py-3 rounded-xl hover:bg-zinc-800 transition-colors text-center no-underline">
          Track Order →
        </a>
      </div>
    </div>
  );

  const stepIdx = STEPS.indexOf(step);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-sm font-black tracking-tight text-zinc-900">Admin Studio</span>
          <span className="text-xs text-zinc-400 font-medium">Create Test Order</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Create Order</h1>
          <p className="text-sm text-zinc-400 mt-1">Simulate a customer order end-to-end</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black border-2 transition-all
                  ${i < stepIdx  ? "bg-zinc-900 border-zinc-900 text-white"
                  : i === stepIdx ? "bg-white border-zinc-900 text-zinc-900"
                  : "bg-white border-zinc-200 text-zinc-300"}`}>
                  {i < stepIdx ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : i + 1}
                </div>
                <span className={`text-xs font-bold tracking-wide transition-colors hidden sm:block
                  ${i === stepIdx ? "text-zinc-900" : i < stepIdx ? "text-zinc-500" : "text-zinc-300"}`}>
                  {STEP_LABELS[s]}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-3 transition-colors ${i < stepIdx ? "bg-zinc-900" : "bg-zinc-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* ══════════ STEP: CART ══════════ */}
        {step === "cart" && (
          <div className="space-y-4">
            <Card>
              <CardHeader icon="📦" title="Products" right={`${products.length} available`} />
              <div className="p-6">
                {loadingData ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="rounded-xl bg-zinc-100 animate-pulse h-52" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {products.map(p => {
                      const price = ep(p);
                      const hasD  = price < p.pricing.sellingPrice;
                      return (
                        <div key={p._id} className="border border-zinc-200 rounded-xl overflow-hidden bg-white hover:border-zinc-400 transition-all group">
                          {p.images?.[0]
                            ? <img src={p.images[0]} alt={p.name} className="w-full h-28 object-cover bg-zinc-100" />
                            : <div className="w-full h-28 bg-zinc-100 flex items-center justify-center text-2xl opacity-30">📷</div>
                          }
                          <div className="p-3">
                            <p className="text-xs font-bold text-zinc-900 leading-tight mb-1 line-clamp-2">{p.name}</p>
                            <div className="flex items-baseline gap-1.5 mb-2">
                              <span className="text-xs font-black text-zinc-900">{fmt(price, p.pricing.currency)}</span>
                              {hasD && <span className="text-[10px] text-zinc-400 line-through">{fmt(p.pricing.sellingPrice)}</span>}
                            </div>
                            {p.hasSize && p.sizes?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {p.sizes.map(s => (
                                  <button key={s} type="button"
                                    onClick={() => setSelectedSizes(prev => ({ ...prev, [p._id]: s }))}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all
                                      ${selectedSizes[p._id] === s
                                        ? "bg-zinc-900 border-zinc-900 text-white"
                                        : "border-zinc-200 text-zinc-500 hover:border-zinc-400"}`}>
                                    {s}
                                  </button>
                                ))}
                              </div>
                            )}
                            <button type="button"
                              disabled={p.hasSize && !selectedSizes[p._id]}
                              onClick={() => addProduct(p, p.hasSize ? selectedSizes[p._id] : "")}
                              className="w-full py-1.5 rounded-lg bg-zinc-900 text-white text-[11px] font-bold hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                              + Add
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>

            {addons.length > 0 && (
              <Card>
                <CardHeader icon="🎁" title="Add-ons" right="Optional" />
                <div className="p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {addons.map(a => {
                      const selected = cartAddons.find(ca => ca.addon._id === a._id);
                      return (
                        <div key={a._id} className={`border rounded-xl overflow-hidden transition-all
                          ${selected ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 bg-white hover:border-zinc-400"}`}>
                          <img src={a.image} alt={a.name} className="w-full h-24 object-cover bg-zinc-100" />
                          <div className="p-3">
                            <p className="text-xs font-bold text-zinc-900 mb-0.5">{a.name}</p>
                            <p className="text-[10px] text-zinc-400 mb-2">{fmt(a.price, a.currency)}</p>
                            <button type="button" onClick={() => toggleAddon(a)}
                              className={`w-full py-1.5 rounded-lg text-[11px] font-bold border transition-all
                                ${selected
                                  ? "bg-zinc-900 border-zinc-900 text-white"
                                  : "border-zinc-200 text-zinc-500 hover:border-zinc-400"}`}>
                              {selected ? "✓ Added" : "+ Add"}
                            </button>
                            {selected && (
                              <div className="mt-2 space-y-2">
                                {a.note && (
                                  <textarea
                                    className="w-full border border-zinc-200 rounded-lg px-2.5 py-1.5 text-[11px] text-zinc-700 outline-none focus:border-zinc-900 resize-none min-h-[48px] placeholder:text-zinc-300"
                                    placeholder={a.note} value={selected.customerNote}
                                    onChange={e => updateAddonNote(a._id, e.target.value)} />
                                )}
                                <div className="flex justify-center">
                                  <QtyControl
                                    value={selected.quantity}
                                    onDec={() => updateAddonQty(a._id, selected.quantity - 1)}
                                    onInc={() => updateAddonQty(a._id, selected.quantity + 1)} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            )}

            {cartItems.length > 0 && (
              <Card>
                <CardHeader icon="🛒" title="Order Summary" right={`${cartItems.length} item${cartItems.length !== 1 ? "s" : ""}`} />
                <div className="p-6">
                  <div className="space-y-3 mb-5">
                    {cartItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        {item.product.images?.[0]
                          ? <img src={item.product.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover bg-zinc-100 flex-shrink-0" />
                          : <div className="w-12 h-12 rounded-lg bg-zinc-100 flex-shrink-0 flex items-center justify-center text-lg opacity-30">📷</div>
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-zinc-900 truncate">{item.product.name}</p>
                          <p className="text-[10px] text-zinc-400">{item.size && `Size ${item.size} · `}{fmt(ep(item.product))} each</p>
                        </div>
                        <QtyControl
                          value={item.quantity}
                          onDec={() => updateCartQty(idx, item.quantity - 1)}
                          onInc={() => updateCartQty(idx, item.quantity + 1)} />
                        <span className="text-sm font-bold text-zinc-900 w-20 text-right">{fmt(ep(item.product) * item.quantity)}</span>
                        <button type="button" onClick={() => removeCartItem(idx)}
                          className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-400 text-[10px] flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* ── Promo code input ── */}
                  <div className="mb-5">
                    <label className={labelCls}>Promo Code</label>
                    <PromoInput
                      subtotal={subtotalBeforePromo}
                      productIds={cartProductIds}
                      appliedPromo={appliedPromo}
                      onApply={setAppliedPromo}
                      onRemove={() => setAppliedPromo(null)}
                    />
                  </div>

                  {/* ── Totals ── */}
                  <div className="border border-zinc-100 rounded-xl overflow-hidden">
                    <div className="flex justify-between px-4 py-2.5 border-b border-zinc-100 text-sm">
                      <span className="text-zinc-400">Items</span>
                      <span className="font-semibold text-zinc-900">{fmt(itemsSubtotal)}</span>
                    </div>
                    {addonsSubtotal > 0 && (
                      <div className="flex justify-between px-4 py-2.5 border-b border-zinc-100 text-sm">
                        <span className="text-zinc-400">Add-ons</span>
                        <span className="font-semibold text-zinc-900">{fmt(addonsSubtotal)}</span>
                      </div>
                    )}
                    {promoDiscount > 0 && (
                      <div className="flex justify-between px-4 py-2.5 border-b border-zinc-100 text-sm bg-emerald-50">
                        <span className="text-emerald-600 font-medium flex items-center gap-1.5">
                          <span>🏷️</span>
                          Promo <span className="font-mono text-[11px] tracking-widest">{appliedPromo?.code}</span>
                        </span>
                        <span className="font-bold text-emerald-600">− {fmt(promoDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between px-4 py-2.5 border-b border-zinc-100 text-sm">
                      <span className="text-zinc-400">Delivery <span className="text-[10px]">(set after address)</span></span>
                      <span className="text-zinc-300">—</span>
                    </div>
                    <div className="flex justify-between px-4 py-3 bg-zinc-50 text-sm font-bold">
                      <span className="text-zinc-900">Subtotal {promoDiscount > 0 ? "(after promo)" : "(excl. delivery)"}</span>
                      <span className="text-zinc-900">{fmt(subtotal)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ══════════ STEP: DELIVERY ══════════ */}
        {step === "delivery" && (
          <Card>
            <CardHeader icon="🚚" title="Delivery Information" />
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name *">
                  <input className={inputCls} value={del.fullName} onChange={e => setDel(p => ({ ...p, fullName: e.target.value }))} placeholder="Customer full name" />
                </Field>
                <Field label="Phone *">
                  <input className={inputCls} value={del.phone} onChange={e => setDel(p => ({ ...p, phone: e.target.value }))} placeholder="01XXXXXXXXX" />
                </Field>
                <Field label="Email *" full>
                  <input className={inputCls} type="email" value={del.email} onChange={e => setDel(p => ({ ...p, email: e.target.value }))} placeholder="customer@email.com" />
                </Field>
                <Field label="Address *" full>
                  <input className={inputCls} value={del.address} onChange={e => setDel(p => ({ ...p, address: e.target.value }))} placeholder="House, Road, Area" />
                </Field>
                <Field label="Zilla *">
                  <div className="relative">
                    <select className={selectCls} value={del.zilla} onChange={e => handleZillaChange(e.target.value)}>
                      <option value="">Select Zilla…</option>
                      {ZILLAS.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 pointer-events-none">▼</span>
                  </div>
                </Field>
                <Field label="Thana *">
                  <div className="relative">
                    <select className={selectCls} value={del.thana} disabled={!del.zilla}
                      onChange={e => setDel(p => ({ ...p, thana: e.target.value }))}>
                      <option value="">{del.zilla ? "Select Thana…" : "Select a Zilla first"}</option>
                      {availableThanas.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 pointer-events-none">▼</span>
                  </div>
                  {!del.zilla && <p className="text-[11px] text-zinc-400 italic mt-1">Select a zilla first</p>}
                </Field>
                <Field label="Delivery Note">
                  <input className={inputCls} value={del.note} onChange={e => setDel(p => ({ ...p, note: e.target.value }))} placeholder="Any special instructions…" />
                </Field>
                <Field label="Country">
                  <input className={`${inputCls} opacity-50`} value="Bangladesh" disabled />
                </Field>
              </div>

              {del.zilla && del.thana && (
                <div className="mt-5 flex items-center justify-between bg-zinc-900 text-white rounded-xl px-5 py-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Delivery Charge</p>
                    <p className="text-xs text-zinc-400">{isInsideDhaka ? "Inside Dhaka city" : "Outside Dhaka / outskirts"}</p>
                  </div>
                  <p className="text-2xl font-black">{fmt(deliveryCharge)}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* ══════════ STEP: BILLING ══════════ */}
        {step === "billing" && (
          <Card>
            <CardHeader icon="🧾" title="Billing Information" />
            <div className="p-6">
              <div className="grid grid-cols-2 gap-2 mb-6">
                {[
                  { label: "✓ Same as Delivery", val: true  },
                  { label: "+ Different Person", val: false },
                ].map(({ label, val }) => (
                  <button key={String(val)} type="button"
                    onClick={() => setSameAsDelivery(val)}
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all
                      ${sameAsDelivery === val
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 text-zinc-400 hover:border-zinc-400"}`}>
                    {label}
                  </button>
                ))}
              </div>

              {sameAsDelivery ? (
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl px-5 py-4 text-sm text-zinc-500">
                  Using <strong className="text-zinc-900">{del.email}</strong> and <strong className="text-zinc-900">{del.phone}</strong> from delivery.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Full Name *" full>
                    <input className={inputCls} value={bil.fullName} onChange={e => setBil(p => ({ ...p, fullName: e.target.value }))} placeholder="Billing contact name" />
                  </Field>
                  <Field label="Email *">
                    <input className={inputCls} type="email" value={bil.email} onChange={e => setBil(p => ({ ...p, email: e.target.value }))} placeholder="billing@email.com" />
                  </Field>
                  <Field label="Phone *">
                    <input className={inputCls} value={bil.phone} onChange={e => setBil(p => ({ ...p, phone: e.target.value }))} placeholder="01XXXXXXXXX" />
                  </Field>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* ══════════ STEP: PAYMENT ══════════ */}
        {step === "payment" && (
          <Card>
            <CardHeader icon="💳" title="Payment Method" />
            <div className="p-6">
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { method: "COD"   as const, icon: "💵", label: "Cash on Delivery", sub: "Pay when you receive"   },
                  { method: "Bkash" as const, icon: "📱", label: "Bkash",            sub: "Mobile banking payment" },
                ].map(({ method, icon, label, sub }) => (
                  <button key={method} type="button" onClick={() => setPayMethod(method)}
                    className={`p-5 rounded-xl border-2 text-left transition-all
                      ${payMethod === method
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 hover:border-zinc-400 bg-white"}`}>
                    <div className="text-2xl mb-2">{icon}</div>
                    <div className={`text-sm font-bold ${payMethod === method ? "text-white" : "text-zinc-900"}`}>{label}</div>
                    <div className={`text-xs mt-0.5 ${payMethod === method ? "text-zinc-400" : "text-zinc-400"}`}>{sub}</div>
                  </button>
                ))}
              </div>

              {payMethod === "Bkash" && (
                <div className="space-y-4 p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <Field label="Bkash Phone Number *">
                    <input className={inputCls} value={bkashPhone} onChange={e => setBkashPhone(e.target.value)} placeholder="01XXXXXXXXX" />
                  </Field>
                  <Field label="Transaction ID *">
                    <input className={inputCls} value={bkashTxn} onChange={e => setBkashTxn(e.target.value)} placeholder="e.g. 8N6YJU9K2L" />
                  </Field>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* ══════════ STEP: REVIEW ══════════ */}
        {step === "review" && (
          <div className="space-y-4">
            <Card>
              <CardHeader icon="🛒" title="Order Items" />
              <div className="p-6 space-y-2">
                {cartItems.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b border-zinc-100 last:border-0">
                    <span className="text-sm text-zinc-600">{item.product.name}{item.size ? ` (${item.size})` : ""} <span className="text-zinc-400">× {item.quantity}</span></span>
                    <span className="text-sm font-bold text-zinc-900">{fmt(ep(item.product) * item.quantity)}</span>
                  </div>
                ))}
                {cartAddons.map((a, i) => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b border-zinc-100 last:border-0">
                    <span className="text-sm text-zinc-600">🎁 {a.addon.name} <span className="text-zinc-400">× {a.quantity}</span></span>
                    <span className="text-sm font-bold text-zinc-900">{fmt(a.addon.price * a.quantity)}</span>
                  </div>
                ))}
                <div className="pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Items + Add-ons</span>
                    <span className="font-semibold text-zinc-900">{fmt(subtotalBeforePromo)}</span>
                  </div>
                  {/* Promo line in review */}
                  {appliedPromo && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600 font-medium flex items-center gap-1.5">
                        🏷️ Promo <span className="font-mono text-[11px] tracking-widest bg-emerald-100 px-1.5 py-0.5 rounded">{appliedPromo.code}</span>
                      </span>
                      <span className="font-bold text-emerald-600">− {fmt(promoDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Delivery <span className="text-xs">({isInsideDhaka ? "Inside Dhaka" : "Outside Dhaka"})</span></span>
                    <span className="font-semibold text-zinc-900">{fmt(deliveryCharge)}</span>
                  </div>
                  <div className="flex justify-between text-base font-black pt-2 border-t border-zinc-200">
                    <span className="text-zinc-900">Grand Total</span>
                    <span className="text-zinc-900">{fmt(grandTotal)}</span>
                  </div>
                  {appliedPromo && (
                    <p className="text-[11px] text-emerald-600 text-right font-medium">
                      You're saving {fmt(promoDiscount)} with promo code {appliedPromo.code} 🎉
                    </p>
                  )}
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader icon="🚚" title="Delivery" />
                <div className="p-5 space-y-2">
                  {[
                    ["Name",    del.fullName],
                    ["Phone",   del.phone],
                    ["Email",   del.email],
                    ["Address", `${del.address}, ${del.thana}, ${del.zilla}`],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
                      <p className="text-xs font-semibold text-zinc-900 mt-0.5">{val}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <CardHeader icon="💳" title="Payment" />
                <div className="p-5 space-y-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Method</p>
                    <p className="text-xs font-semibold text-zinc-900 mt-0.5">{payMethod}</p>
                  </div>
                  {payMethod === "Bkash" && <>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Bkash Phone</p>
                      <p className="text-xs font-semibold text-zinc-900 mt-0.5">{bkashPhone}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Transaction ID</p>
                      <p className="text-xs font-mono font-semibold text-zinc-900 mt-0.5">{bkashTxn}</p>
                    </div>
                  </>}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="flex justify-between items-center mt-6">
          <button type="button" onClick={prevStep}
            className={`px-5 py-2.5 rounded-xl border border-zinc-200 text-sm font-bold text-zinc-500 hover:border-zinc-400 hover:text-zinc-900 transition-all ${stepIdx === 0 ? "invisible" : ""}`}>
            ← Back
          </button>
          {step !== "review" ? (
            <button type="button" onClick={nextStep}
              className="px-6 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-700 transition-colors">
              Continue →
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 flex items-center gap-2">
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Placing…
                </>
              ) : `Place Order · ${fmt(grandTotal)} →`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
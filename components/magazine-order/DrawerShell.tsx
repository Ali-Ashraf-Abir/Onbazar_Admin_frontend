import { money } from "@/utils/adminUtils";

export function DrawerShell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-[1000] bg-black/30"
        onClick={onClose}
      />

      <aside className="fixed right-0 top-0 z-[1001] h-screen w-full max-w-md border-l border-neutral-200 bg-white shadow-xl">
        {children}
      </aside>
    </>
  );
}

export function DrawerSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-neutral-100 py-5">
      <h3 className="mb-3 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
        {title}
      </h3>

      {children}
    </section>
  );
}

export function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-4 py-1.5 text-[12px]">
      <span className="w-24 shrink-0 text-neutral-400">
        {label}
      </span>

      <span className="break-words text-neutral-800">
        {value}
      </span>
    </div>
  );
}

export function PriceRow({
  label,
  value,
  currency,
}: {
  label: string;
  value: number;
  currency: string;
}) {
  return (
    <div className="flex justify-between py-1.5 text-[12px]">
      <span className="text-neutral-500">
        {label}
      </span>

      <span
        className={
          value < 0
            ? "text-red-500"
            : "text-neutral-800"
        }
      >
        {value < 0 ? "-" : ""}
        {money(
          currency,
          Math.abs(value)
        )}
      </span>
    </div>
  );
}
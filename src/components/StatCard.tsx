interface StatCardProps {
  label: string;
  value: number | string;
  accent?: "default" | "warning" | "success";
}

export function StatCard({ label, value, accent = "default" }: StatCardProps) {
  const accentClass =
    accent === "warning"
      ? "text-amber-600"
      : accent === "success"
      ? "text-emerald-600"
      : "text-brand";

  const barClass =
    accent === "warning"
      ? "from-amber-400 to-amber-600"
      : accent === "success"
      ? "from-emerald-400 to-emerald-600"
      : "from-[var(--brand)] to-[var(--brand-glow)]";

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${barClass} opacity-80`}
        aria-hidden
      />
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-2 text-4xl font-semibold ${accentClass} animate-in fade-in slide-in-from-bottom-2 duration-500`}
      >
        {value}
      </p>
    </div>
  );
}

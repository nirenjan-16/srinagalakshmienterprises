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

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={`mt-2 text-4xl font-semibold ${accentClass}`}>{value}</p>
    </div>
  );
}

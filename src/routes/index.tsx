import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { StatCard } from "@/components/StatCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sri Nagalakshmi Enterprises – OrderDesk" },
      { name: "description", content: "Order management dashboard for Sri Nagalakshmi Enterprises, FMCG Distributor." },
      { property: "og:title", content: "Sri Nagalakshmi Enterprises – OrderDesk" },
      { property: "og:description", content: "Order management dashboard for Sri Nagalakshmi Enterprises, FMCG Distributor." },
    ],
  }),
  component: Index,
});

// Placeholder data — wire to real orders source when backend is ready.
const stats = {
  todaysOrders: 0,
  pendingOrders: 0,
  deliveredToday: 0,
};

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Orders Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Daily overview of your distribution operations.
          </p>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Today's Orders" value={stats.todaysOrders} />
          <StatCard label="Pending Orders" value={stats.pendingOrders} accent="warning" />
          <StatCard label="Delivered Today" value={stats.deliveredToday} accent="success" />
        </section>

        <section className="mt-10 rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Orders list will appear here.
        </section>
      </main>
    </div>
  );
}

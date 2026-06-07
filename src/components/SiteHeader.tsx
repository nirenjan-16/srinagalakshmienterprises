export function SiteHeader() {
  return (
    <header className="w-full bg-brand text-brand-foreground shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex flex-col leading-tight">
          <span style={{ fontFamily: 'Georgia, "Times New Roman", serif' }} className="text-2xl font-semibold tracking-wide">
            Sri Nagalakshmi Enterprises
          </span>
          <span className="text-xs uppercase tracking-[0.2em] text-brand-foreground/70">
            FMCG Distributor
          </span>
        </div>
        <nav className="hidden gap-6 text-sm font-medium md:flex">
          <a href="/" className="hover:text-brand-foreground/80">Orders</a>
        </nav>
      </div>
    </header>
  );
}

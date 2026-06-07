import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth";

const navLinks = [
  { to: "/", label: "Dashboard" },
  { to: "/orders", label: "Orders" },
  { to: "/products", label: "Products" },
  { to: "/settings", label: "Settings" },
] as const;

export function SiteHeader() {
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
    navigate({ to: "/login" });
  };

  return (
    <header className="w-full bg-brand text-brand-foreground shadow-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link to="/" className="flex flex-col leading-tight">
          <span
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            className="text-2xl font-semibold tracking-wide"
          >
            Sri Nagalakshmi Enterprises
          </span>
          <span className="text-xs uppercase tracking-[0.2em] text-brand-foreground/70">
            FMCG Distributor
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-1 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeOptions={{ exact: link.to === "/" }}
              className="rounded-md px-3 py-1.5 transition hover:bg-white/10"
              activeProps={{ className: "bg-white/15" }}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="ml-2 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}

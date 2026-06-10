import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth";
import logoAsset from "@/assets/sri-nagalakshmi-logo.svg.asset.json";

const navLinks = [
  { to: "/", label: "Dashboard" },
  { to: "/orders", label: "Orders" },
  { to: "/orders/archive", label: "Archive" },
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
    <header
      className="w-full text-brand-foreground shadow-lg backdrop-blur"
      style={{ backgroundImage: "var(--gradient-brand)" }}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link
          to="/"
          aria-label="Sri Nagalakshmi Enterprises — Home"
          className="group flex items-center gap-3 transition-transform duration-300 hover:scale-[1.02]"
        >
          <img
            src={logoAsset.url}
            alt="Sri Nagalakshmi Enterprises"
            className="h-16 w-16 shrink-0 rounded-xl bg-white/95 p-1.5 shadow-md ring-1 ring-white/30 transition-shadow duration-300 group-hover:shadow-[var(--shadow-glow)] md:h-[72px] md:w-[72px]"
          />
        </Link>

        <nav className="flex flex-wrap items-center gap-1 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeOptions={{ exact: link.to === "/" }}
              className="relative rounded-md px-3 py-1.5 transition-all duration-200 hover:bg-white/10"
              activeProps={{ className: "bg-white/15 shadow-inner" }}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="ml-2 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-all duration-200 hover:bg-red-500/20 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}

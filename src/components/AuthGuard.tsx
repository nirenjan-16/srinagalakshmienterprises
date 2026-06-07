import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";

export function AuthGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate({ to: "/login" });
    } else {
      setReady(true);
    }
  }, [navigate]);

  if (!ready) return null;
  return <>{children}</>;
}

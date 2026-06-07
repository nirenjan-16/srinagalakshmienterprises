import { supabase } from "@/integrations/supabase/client";

/**
 * Purge orders that have aged out of the archive:
 *  - Delivered orders older than 5 days (since delivered_at)
 *  - Cancelled orders older than 3 days (since cancelled_at)
 */
export async function purgeOldArchivedOrders() {
  const now = Date.now();
  const fiveDaysAgo = new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString();
  const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString();

  await supabase
    .from("orders")
    .delete()
    .eq("status", "Delivered")
    .lt("delivered_at", fiveDaysAgo);

  await supabase
    .from("orders")
    .delete()
    .eq("status", "Cancelled")
    .lt("cancelled_at", threeDaysAgo);
}

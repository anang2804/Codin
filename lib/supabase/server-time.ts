import { createClient } from "@/lib/supabase/client";

export async function getServerTimeMs() {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_server_time");

  if (error || !data) {
    return Date.now();
  }

  const serverTime = new Date(data).getTime();

  return Number.isNaN(serverTime) ? Date.now() : serverTime;
}

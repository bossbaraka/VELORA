import { CONFIG } from "@/constants/config";
export async function sendEnquiry(
  data: Record<string, string>,
): Promise<{ ok: boolean; demo: true }> {
  await new Promise((r) => setTimeout(r, CONFIG.demoDelay));
  return { ok: Boolean(data.email && data.name), demo: true };
}

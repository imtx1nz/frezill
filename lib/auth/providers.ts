/**
 * Reads which OAuth providers are switched on in Supabase, so the UI only offers
 * buttons that work. Cached for 5 minutes; any failure counts as "off".
 */
export async function enabledProviders(): Promise<{ google: boolean }> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      next: { revalidate: 300 },
    });
    if (!res.ok) return { google: false };
    const settings = (await res.json()) as { external?: Record<string, boolean> };
    return { google: settings.external?.google === true };
  } catch {
    return { google: false };
  }
}

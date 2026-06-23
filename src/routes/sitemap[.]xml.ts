import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SITE_URL = "https://shadov.pro";

const STATIC_PATHS = [
  "/",
  "/about",
  "/contacts",
  "/prices",
  "/catalog",
  "/how-we-work",
  "/faq",
  "/requisites",
  "/kalkulyator-stoimosti",
  "/team",
  "/portfolio",
  "/reviews",
  "/sro-i-dokumenty",
  "/kontrol-kachestva",
  // Construction services
  "/stroitelstvo",
  "/stroitelstvo-domov-pod-klyuch",
  "/generalnyy-podryad",
  "/doma-iz-brusa",
  "/doma-iz-kleenogo-brusa",
  "/doma-iz-gazobetona",
  "/doma-iz-keramicheskih-blokov",
  "/doma-iz-sip-paneley",
  "/karkasnye-doma",
  "/kirpichnye-doma",
  "/kombinirovannye-doma",
  "/monolitnye-doma",
  "/mnogokvartirnye-doma",
  "/fundamenty",
  "/kladochnye-raboty",
  "/monolitnye-raboty",
  "/krovelnye-raboty",
  "/fasadnye-raboty",
  // Repair services
  "/remont",
  "/remont-pod-klyuch",
  "/kosmeticheskiy-remont",
  "/ekonom-remont",
  "/standartnyy-remont",
  "/evroremont",
  "/premialnyy-remont",
  "/biznes-remont",
  "/chernovoy-remont",
  "/chistovaya-otdelka",
  "/ukladka-plitki",
  // Engineering
  "/inzhenernye-sistemy",
  "/elektromontazh",
  "/santehnika",
  "/otoplenie",
  "/teplyy-pol",
  "/vodosnabzhenie-kanalizatsiya",
  // Legal
  "/privacy",
  "/terms",
  "/cookies",
  "/personal-data-consent",
];

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function urlNode(loc: string, lastmod?: string | null): string {
  return `  <url><loc>${xmlEscape(SITE_URL + loc)}</loc>${
    lastmod ? `<lastmod>${xmlEscape(lastmod.slice(0, 10))}</lastmod>` : ""
  }</url>`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_PUBLISHABLE_KEY;
        const lines: string[] = STATIC_PATHS.map((p) => urlNode(p));

        if (url && key) {
          const sb = createClient<Database>(url, key, {
            auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
          });

          const [cats, svcs] = await Promise.all([
            sb
              .from("service_categories")
              .select("slug, updated_at")
              .eq("status", "published"),
            sb
              .from("services")
              .select("slug, updated_at, service_categories(slug)")
              .eq("status", "published"),
          ]);

          for (const c of cats.data ?? []) {
            lines.push(urlNode(`/catalog/${c.slug}`, c.updated_at));
          }
          for (const s of (svcs.data ?? []) as Array<{
            slug: string;
            updated_at: string;
            service_categories: { slug: string } | null;
          }>) {
            const catSlug = s.service_categories?.slug;
            if (!catSlug) continue;
            lines.push(urlNode(`/catalog/${catSlug}/${s.slug}`, s.updated_at));
          }
        }

        const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${lines.join("\n")}\n</urlset>\n`;

        return new Response(body, {
          status: 200,
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=300, s-maxage=900",
          },
        });
      },
    },
  },
});
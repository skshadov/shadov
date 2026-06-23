import { createFileRoute } from "@tanstack/react-router";

const SITE_URL = "https://shadov.pro";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const body = `User-agent: *\nDisallow: /admin\nDisallow: /client\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
        return new Response(body, {
          status: 200,
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
import { createFileRoute } from "@tanstack/react-router";

const SITE_URL = "https://shadov.pro";

export const Route = createFileRoute("/api/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const body = `User-agent: *
Disallow: /admin
Disallow: /client
Disallow: /api/
Allow: /api/sitemap.xml

Sitemap: ${SITE_URL}/sitemap.xml
`;
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
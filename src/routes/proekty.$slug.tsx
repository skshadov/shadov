import { createFileRoute, redirect } from "@tanstack/react-router";

/** Страницы проектов домов сняты с публикации. Постоянный редирект 301. */
export const Route = createFileRoute("/proekty/$slug")({
  beforeLoad: () => {
    throw redirect({ to: "/prices" as never, statusCode: 301 });
  },
});

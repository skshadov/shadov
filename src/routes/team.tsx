import { createFileRoute, redirect } from "@tanstack/react-router";

/** Страница «Команда» снята с публикации. Постоянный редирект 301. */
export const Route = createFileRoute("/team")({
  beforeLoad: () => {
    throw redirect({ to: "/about" as never, statusCode: 301 });
  },
});

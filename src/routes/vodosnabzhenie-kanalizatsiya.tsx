import { createFileRoute, redirect } from "@tanstack/react-router";

/** Страница снята с публикации: черновая сантехника вынесена в отдельную услугу. */
export const Route = createFileRoute("/vodosnabzhenie-kanalizatsiya")({
  beforeLoad: () => {
    throw redirect({ to: "/razvodka-santehniki" as never, statusCode: 301 });
  },
});

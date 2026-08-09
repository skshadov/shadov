import { createFileRoute, redirect } from "@tanstack/react-router";

/** Каталог проектов домов снят с публикации: компания занимается
 *  черновым циклом. Постоянный редирект 301. */
export const Route = createFileRoute("/proekty/")({
  beforeLoad: () => {
    throw redirect({ to: "/prices" as never, statusCode: 301 });
  },
});

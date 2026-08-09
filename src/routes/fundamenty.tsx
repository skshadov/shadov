import { createFileRoute, redirect } from "@tanstack/react-router";

/** Страница снята с публикации: компания специализируется на штукатурке,
 *  стяжке, тёплом поле и черновой инженерии. Постоянный редирект 301. */
export const Route = createFileRoute("/fundamenty")({
  beforeLoad: () => {
    throw redirect({ to: "/styazhka-pola" as never, statusCode: 301 });
  },
});

import { createFileRoute, redirect } from "@tanstack/react-router";

/** Страница снята с публикации: компания специализируется на штукатурке,
 *  стяжке, тёплом поле и черновой инженерии. Постоянный редирект 301. */
export const Route = createFileRoute("/chistovaya-otdelka")({
  beforeLoad: () => {
    throw redirect({ to: "/mekhanizirovannaya-shtukaturka" as never, statusCode: 301 });
  },
});

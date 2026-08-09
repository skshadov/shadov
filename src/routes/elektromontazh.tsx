import { createFileRoute, redirect } from "@tanstack/react-router";

/** Страница снята с публикации: компания специализируется на штукатурке,
 *  стяжке, тёплом поле и черновой инженерии. Постоянный редирект 301. */
export const Route = createFileRoute("/elektromontazh")({
  beforeLoad: () => {
    throw redirect({ to: "/razvodka-elektriki" as never, statusCode: 301 });
  },
});

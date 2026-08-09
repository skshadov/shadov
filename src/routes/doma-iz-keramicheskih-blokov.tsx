import { createFileRoute, redirect } from "@tanstack/react-router";

/** Страница снята с публикации: компания специализируется на штукатурке,
 *  стяжке, тёплом поле и черновой инженерии. Постоянный редирект 301. */
export const Route = createFileRoute("/doma-iz-keramicheskih-blokov")({
  beforeLoad: () => {
    throw redirect({ to: "/prices" as never, statusCode: 301 });
  },
});

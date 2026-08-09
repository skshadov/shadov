import { createFileRoute } from "@tanstack/react-router";
import { ServiceLandingPage } from "@/components/service/ServiceLandingPage";
import { buildServiceHead } from "@/components/service/serviceHead";
import { POLUSUHAYA } from "@/data/pricing";

export const Route = createFileRoute("/polusuhaya-styazhka")({
  head: () => buildServiceHead(POLUSUHAYA),
  component: () => <ServiceLandingPage data={POLUSUHAYA} />,
});

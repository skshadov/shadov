import { createFileRoute } from "@tanstack/react-router";
import { ServiceLandingPage } from "@/components/service/ServiceLandingPage";
import { buildServiceHead } from "@/components/service/serviceHead";
import { TEPLYY_POL } from "@/data/pricing";

export const Route = createFileRoute("/teplyy-pol")({
  head: () => buildServiceHead(TEPLYY_POL),
  component: () => <ServiceLandingPage data={TEPLYY_POL} />,
});

import { createFileRoute } from "@tanstack/react-router";
import { ServiceLandingPage } from "@/components/service/ServiceLandingPage";
import { buildServiceHead } from "@/components/service/serviceHead";
import { SANTEHNIKA } from "@/data/pricing";

export const Route = createFileRoute("/razvodka-santehniki")({
  head: () => buildServiceHead(SANTEHNIKA),
  component: () => <ServiceLandingPage data={SANTEHNIKA} />,
});
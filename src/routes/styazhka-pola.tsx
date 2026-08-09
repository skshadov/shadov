import { createFileRoute } from "@tanstack/react-router";
import { ServiceLandingPage } from "@/components/service/ServiceLandingPage";
import { buildServiceHead } from "@/components/service/serviceHead";
import { STYAZHKA } from "@/data/pricing";

export const Route = createFileRoute("/styazhka-pola")({
  head: () => buildServiceHead(STYAZHKA),
  component: () => <ServiceLandingPage data={STYAZHKA} />,
});
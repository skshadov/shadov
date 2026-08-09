import { createFileRoute } from "@tanstack/react-router";
import { ServiceLandingPage } from "@/components/service/ServiceLandingPage";
import { buildServiceHead } from "@/components/service/serviceHead";
import { SHTUKATURKA } from "@/data/pricing";

export const Route = createFileRoute("/mekhanizirovannaya-shtukaturka")({
  head: () => buildServiceHead(SHTUKATURKA),
  component: () => <ServiceLandingPage data={SHTUKATURKA} />,
});
import { createFileRoute } from "@tanstack/react-router";
import { ServiceLandingPage } from "@/components/service/ServiceLandingPage";
import { buildServiceHead } from "@/components/service/serviceHead";
import { ELEKTRIKA } from "@/data/pricing";

export const Route = createFileRoute("/razvodka-elektriki")({
  head: () => buildServiceHead(ELEKTRIKA),
  component: () => <ServiceLandingPage data={ELEKTRIKA} />,
});
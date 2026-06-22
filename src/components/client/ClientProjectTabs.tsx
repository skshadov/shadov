import { Link } from "@tanstack/react-router";
import type { ProjectRow } from "@/lib/client-portal/api";
import { OverviewTab } from "./tabs/OverviewTab";
import { StagesTab } from "./tabs/StagesTab";
import { ReportsTab } from "./tabs/ReportsTab";
import { CamerasTab } from "./tabs/CamerasTab";
import { MessagesTab } from "./tabs/MessagesTab";
import { PaymentsTab } from "./tabs/PaymentsTab";
import { DocumentsTab } from "./tabs/DocumentsTab";

export const TAB_KEYS = ["overview", "stages", "reports", "cameras", "messages", "payments", "documents"] as const;
export type TabKey = typeof TAB_KEYS[number];

const TAB_LABELS: Record<TabKey, string> = {
  overview: "Обзор", stages: "Этапы", reports: "Отчёты", cameras: "Камеры",
  messages: "Сообщения", payments: "Оплаты", documents: "Документы",
};

interface Props { projectId: string; activeTab: TabKey; project: ProjectRow; userId: string }

export function ProjectTabs({ projectId, activeTab, project, userId }: Props) {
  return (
    <div>
      <div role="tablist" aria-label="Разделы проекта" className="-mx-1 mb-6 flex flex-wrap gap-1 overflow-x-auto border-b border-border">
        {TAB_KEYS.map((key) => {
          const active = key === activeTab;
          return (
            <Link key={key} role="tab" aria-selected={active}
              to="/client/project/$id" params={{ id: projectId }} search={{ tab: key }}
              className={`min-h-11 rounded-t-md px-3 py-2 text-sm font-medium ${
                active ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>
              {TAB_LABELS[key]}
            </Link>
          );
        })}
      </div>
      <div role="tabpanel">
        {activeTab === "overview" && <OverviewTab project={project} />}
        {activeTab === "stages" && <StagesTab projectId={projectId} />}
        {activeTab === "reports" && <ReportsTab projectId={projectId} />}
        {activeTab === "cameras" && <CamerasTab projectId={projectId} />}
        {activeTab === "messages" && <MessagesTab projectId={projectId} userId={userId} />}
        {activeTab === "payments" && <PaymentsTab projectId={projectId} />}
        {activeTab === "documents" && <DocumentsTab projectId={projectId} />}
      </div>
    </div>
  );
}
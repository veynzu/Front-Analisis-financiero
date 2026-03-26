"use client";

import { useState } from "react";
import { TabBar, type Tab } from "@/components/molecules/TabBar";
import { JobControl } from "@/components/organisms/JobControl";
import { ActivesPanel } from "@/components/organisms/ActivesPanel";
import { SortingPanel } from "@/components/organisms/SortingPanel";
import { TopVolumeDaysPanel } from "@/components/organisms/TopVolumeDaysPanel";

const TABS: Tab[] = [
  { id: "activos", label: "Activos" },
  { id: "ordenamiento", label: "Análisis de ordenamiento" },
  { id: "top-volume", label: "Top volumen" },
];

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<string>("activos");

  return (
    <div className="flex flex-col gap-6 py-8">
      <JobControl />

      <div className="flex flex-col gap-6">
        <TabBar tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

        <div role="tabpanel">
          {activeTab === "activos" && <ActivesPanel />}
          {activeTab === "ordenamiento" && <SortingPanel />}
          {activeTab === "top-volume" && <TopVolumeDaysPanel />}
        </div>
      </div>
    </div>
  );
}

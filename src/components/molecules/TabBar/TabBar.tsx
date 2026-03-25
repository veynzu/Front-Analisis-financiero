"use client";

export type Tab = {
  id: string;
  label: string;
};

type TabBarProps = {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
};

export function TabBar({ tabs, activeTab, onChange }: TabBarProps) {
  return (
    <div
      role="tablist"
      aria-label="Secciones"
      className="flex gap-0 border-b border-zinc-200 dark:border-zinc-800"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 ${
              isActive
                ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

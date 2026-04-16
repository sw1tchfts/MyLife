"use client";

import {
  tabWrapper,
  tabWrapperScrollable,
  tabButton,
  tabButtonActive,
  tabButtonInactive,
} from "@/lib/styles";

interface Tab {
  key: string;
  label: string;
}

interface TabBarProps {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}

export default function TabBar({
  tabs,
  active,
  onChange,
  className = "mb-6",
}: TabBarProps) {
  return (
    <div className={`${tabWrapperScrollable} ${className}`}>
      <div className={tabWrapper}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`${tabButton} ${active === t.key ? tabButtonActive : tabButtonInactive}`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

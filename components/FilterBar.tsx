"use client";

import { CATEGORIES, CITIES, JOB_TYPES, REGIONS } from "@/lib/taxonomy";
import type { Category, JobType, Region, SortKey } from "@/lib/types";

const CATEGORY_PILL_COLORS: Record<string, { bg: string; text: string }> = {
  "互联网": { bg: "rgba(30, 64, 175, .08)", text: "#1E40AF" },
  "金融": { bg: "rgba(180, 83, 9, .08)", text: "#B45309" },
  "外企": { bg: "rgba(4, 120, 87, .08)", text: "#047857" },
  "快消": { bg: "rgba(194, 65, 12, .08)", text: "#C2410C" },
  "实体": { bg: "rgba(100, 116, 139, .08)", text: "#64748B" },
  "管培": { bg: "rgba(124, 58, 237, .08)", text: "#7C3AED" },
  "其他": { bg: "rgba(0, 0, 0, .04)", text: "#64748B" },
};

export interface FilterState {
  categories: (Category | "all")[];
  cities: (string | "all")[];
  jobTypes: (JobType | "all")[];
  region: (Region | "all")[];
  keyword: string;
  urgentOnly: boolean;
  sort: SortKey;
}

function toggleValue<T extends string>(arr: T[], v: T, allKey: T): T[] {
  if (v === allKey) return [allKey];
  const without = arr.filter((x) => x !== allKey);
  const next = without.includes(v) ? without.filter((x) => x !== v) : [...without, v];
  return next.length === 0 ? [allKey] : next;
}

function Pill({
  active,
  onClick,
  children,
  activeStyle,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  activeStyle?: { bg: string; text: string };
}) {
  const customActive = active && activeStyle;
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-2.5 h-[28px] inline-flex items-center whitespace-nowrap rounded text-[12px] font-medium transition-all ${
        customActive
          ? "border-transparent shadow-[var(--shadow-sm)]"
          : active
            ? "bg-[var(--brand)] text-[var(--text-inverse)] border-transparent shadow-[var(--shadow-sm)]"
            : "text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
      }`}
      style={customActive ? { backgroundColor: activeStyle!.bg, color: activeStyle!.text } : undefined}
    >
      {children}
    </button>
  );
}

function MultiRow<T extends string>({
  label,
  options,
  selected,
  onToggle,
  colorMap,
}: {
  label: string;
  options: readonly T[];
  selected: (T | "all")[];
  onToggle: (v: T | "all") => void;
  colorMap?: Record<string, { bg: string; text: string }>;
}) {
  const isAll = selected.includes("all" as T);
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="text-[11px] text-[var(--text-tertiary)] shrink-0 mr-1 w-8">{label}</span>
      <Pill active={isAll} onClick={() => onToggle("all" as T)}>全部</Pill>
      {options.map((o) => (
        <Pill key={o} active={!isAll && selected.includes(o)} onClick={() => onToggle(o)} activeStyle={colorMap?.[o]}>{o}</Pill>
      ))}
    </div>
  );
}

const SORTS: { key: SortKey; label: string }[] = [
  { key: "composite", label: "综合" },
  { key: "aiMatch", label: "AI 匹配" },
  { key: "deadline", label: "截止" },
  { key: "fresh", label: "最新" },
];

export default function FilterBar({
  state,
  onChange,
}: {
  state: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
}) {
  return (
    <div className="card p-4 space-y-3">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
        <input
          value={state.keyword}
          onChange={(e) => onChange({ keyword: e.target.value })}
          placeholder="搜索公司、岗位、城市..."
          className="w-full h-9 pl-9 pr-3 rounded-md border border-[var(--border)] bg-[var(--surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] transition"
        />
      </div>

      <MultiRow
        label="行业"
        options={CATEGORIES}
        selected={state.categories}
        onToggle={(v) => onChange({ categories: toggleValue(state.categories, v, "all") })}
        colorMap={CATEGORY_PILL_COLORS}
      />
      <MultiRow
        label="城市"
        options={CITIES}
        selected={state.cities}
        onToggle={(v) => onChange({ cities: toggleValue(state.cities, v, "all") })}
      />
      <MultiRow
        label="类型"
        options={[...JOB_TYPES, "收藏" as JobType]}
        selected={state.jobTypes}
        onToggle={(v) => onChange({ jobTypes: toggleValue(state.jobTypes, v, "all") })}
      />

      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-1">
          <MultiRow
            label="地区"
            options={REGIONS}
            selected={state.region}
            onToggle={(v) => onChange({ region: toggleValue(state.region, v, "all") })}
          />
          <label className="flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)] ml-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={state.urgentOnly}
              onChange={(e) => onChange({ urgentOnly: e.target.checked })}
              className="accent-[var(--brand)]"
            />
            仅看紧急
          </label>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-[var(--text-tertiary)] mr-1">排序</span>
          {SORTS.map((s) => (
            <Pill key={s.key} active={state.sort === s.key} onClick={() => onChange({ sort: s.key })}>
              {s.label}
            </Pill>
          ))}
        </div>
      </div>
    </div>
  );
}

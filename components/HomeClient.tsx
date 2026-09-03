"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import CompareBar from "./CompareBar";
import FilterBar, { type FilterState } from "./FilterBar";
import Header from "./Header";
import JobCard from "./JobCard";
import Pagination from "./Pagination";
import Sidebar from "./Sidebar";
import { useDataPolling } from "@/lib/hooks/useDataPolling";

const CalendarView = dynamic(() => import("./CalendarView"), { loading: () => <SkeletonGrid /> });
const ComparePanel = dynamic(() => import("./ComparePanel"));
const PrefsPanel = dynamic(() => import("./PrefsPanel"));
const WeeklyPlan = dynamic(() => import("./WeeklyPlan"));

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card p-4 space-y-3 animate-pulse">
          <div className="h-4 bg-[rgba(0,0,0,.06)] rounded w-3/4" />
          <div className="h-3 bg-[rgba(0,0,0,.06)] rounded w-1/2" />
          <div className="h-16 bg-[rgba(0,0,0,.06)] rounded" />
          <div className="h-3 bg-[rgba(0,0,0,.06)] rounded w-full" />
        </div>
      ))}
    </div>
  );
}
import { queryJobs } from "@/lib/filter";
import { computeProfileMatchDetailed, type MatchResult } from "@/lib/matchScore";
import { EMPTY_PREFS, loadPrefs, savePrefs } from "@/lib/prefs";
import { hasPrefs } from "@/lib/ranking";
import { loadTracking, removeTracking, saveTracking, type TrackingData, type TrackingStatus } from "@/lib/tracker";
import type { Job, JobsMeta, Prefs } from "@/lib/types";

type ViewMode = "list" | "calendar";

const PAGE_SIZE = 18;

const DEFAULT_FILTER: FilterState = {
  categories: ["互联网", "金融", "快消", "实体", "管培"],
  cities: ["all"],
  jobTypes: ["all"],
  region: ["大陆"],
  keyword: "",
  urgentOnly: false,
  sort: "composite",
};

export default function HomeClient({
  initialJobs,
  totalCount,
  meta,
  now,
  newJobIds,
}: {
  initialJobs: Job[];
  totalCount: number;
  meta: JobsMeta | null;
  now: number;
  newJobIds: string[];
}) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [page, setPage] = useState(1);
  const [prefs, setPrefs] = useState<Prefs>(EMPTY_PREFS);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("list");
  const [tracking, setTracking] = useState<TrackingData>({});
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [weeklyOpen, setWeeklyOpen] = useState(false);
  const [lastCrawlTime, setLastCrawlTime] = useState<string | null>(null);

  // 数据轮询
  const { hasUpdate, isPolling, refresh, dismissUpdate } = useDataPolling({
    interval: 5 * 60 * 1000, // 每 5 分钟检查一次
    enabled: true,
  });

  // 从 localStorage 读取上次爬取时间
  useEffect(() => {
    const saved = localStorage.getItem("career-search:last-crawl");
    if (saved) {
      setLastCrawlTime(saved);
    }
  }, []);

  useEffect(() => {
    if (totalCount > initialJobs.length) {
      fetch("/data/jobs.json")
        .then((r) => r.json())
        .then((all: Job[]) => setJobs(all))
        .catch(() => {});
    }
  }, [totalCount, initialJobs.length]);

  useEffect(() => {
    const p = loadPrefs();
    setPrefs(p);

    // 本地模式: 始终加载追踪数据
    loadTracking().then(setTracking);
    if (!hasPrefs(p) && typeof window !== "undefined" && !sessionStorage.getItem("skip-profile")) {
      window.location.href = "/profile/";
    }
  }, []);

  function patch(p: Partial<FilterState>) {
    setFilter((f) => ({ ...f, ...p }));
    setPage(1);
  }

  const handleTrack = useCallback(async (jobId: string, status: TrackingStatus | null) => {
    if (status === null) {
      const data = await removeTracking(jobId);
      setTracking(data);
    } else {
      const data = await saveTracking(jobId, status);
      setTracking(data);
    }
  }, []);

  const handleCompareToggle = useCallback((jobId: string) => {
    setCompareIds((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : prev.length < 3 ? [...prev, jobId] : prev
    );
  }, []);

  const result = useMemo(
    () => queryJobs(jobs, { ...filter, prefs, tracking, page, pageSize: PAGE_SIZE }, new Date(now)),
    [jobs, filter, prefs, tracking, page, now],
  );

  const personalized = filter.sort === "composite" && hasPrefs(prefs);

  return (
    <>
      <Header total={jobs.length} onOpenPrefs={() => setPrefsOpen(true)} onOpenWeekly={() => setWeeklyOpen(true)} />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        {/* 数据更新提示 */}
        {hasUpdate && (
          <div className="bg-[var(--brand-light)] border border-[var(--brand)]/20 rounded-lg px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse" />
              <span className="text-sm font-medium text-[var(--brand)]">发现新数据</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  dismissUpdate();
                  refresh();
                }}
                className="text-xs font-medium text-[var(--brand)] hover:underline"
              >
                忽略
              </button>
              <button
                onClick={() => {
                  // 保存当前时间戳，这样刷新后不会再次提示
                  const currentTimestamp = localStorage.getItem("career-search:last-seen-timestamp");
                  if (currentTimestamp) {
                    localStorage.setItem("career-search:last-crawl", new Date().toISOString());
                  }
                  window.location.reload();
                }}
                className="text-xs font-medium px-3 py-1 rounded-md bg-[var(--brand)] text-[var(--text-inverse)] hover:bg-[var(--brand-dark)] transition"
              >
                立即更新
              </button>
            </div>
          </div>
        )}

        <FilterBar
          state={filter}
          onChange={patch}
        />

        {/* Sort bar */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-[var(--text-s)]">
            共 <span className="text-[var(--text)] font-medium font-mono">{result.total}</span> 条
            {personalized && <span className="text-indigo-600 ml-1">· 个性化排序</span>}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setView("list")}
              className={`px-3 h-8 inline-flex items-center rounded-[var(--radius-xs)] text-[13px] transition ${
                view === "list" ? "bg-brand-500 text-white font-bold shadow-[var(--shadow-sm)]" : "text-[var(--text-s)] hover:text-brand-500 hover:bg-brand-50"
              }`}
            >
              列表
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`px-3 h-8 inline-flex items-center rounded-[var(--radius-xs)] text-[13px] transition ${
                view === "calendar" ? "bg-brand-500 text-white font-bold shadow-[var(--shadow-sm)]" : "text-[var(--text-s)] hover:text-brand-500 hover:bg-brand-50"
              }`}
            >
              日历
            </button>
          </div>
        </div>

        {/* Content: left grid + right sidebar */}
        {view === "calendar" ? (
          <CalendarView jobs={jobs} now={now} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
            <section>
              {result.items.length === 0 ? (
                <div className="card p-12 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[rgba(0,0,0,.06)] flex items-center justify-center text-[var(--text-t)]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                  </div>
                  <p className="text-sm text-[var(--text-s)]">没有符合条件的岗位</p>
                  <p className="text-xs text-[var(--text-t)] mt-1">换个筛选试试</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 stagger-grid">
                  {result.items.map((j) => (
                    <JobCard
                      key={j.id}
                      job={j}
                      now={now}
                      isNew={newJobIds.includes(j.id)}
                      trackingStatus={tracking[j.id]?.status ?? null}
                      onTrack={handleTrack}
                      matchResult={hasPrefs(prefs) ? computeProfileMatchDetailed(j, prefs) : undefined}
                      comparing={compareIds.includes(j.id)}
                      onCompareToggle={handleCompareToggle}
                    />
                  ))}
                </div>
              )}
              <Pagination
                page={result.page}
                totalPages={result.totalPages}
                onPage={(p) => {
                  setPage(p);
                  if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </section>
            <Sidebar jobs={jobs} now={now} newJobIds={newJobIds} prefs={prefs} tracking={tracking} onOpenWeekly={() => setWeeklyOpen(true)} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-xs text-[var(--text-t)] flex flex-wrap items-center justify-between gap-3">
          <span>数据来自公开招聘信息，投递以官方页面为准</span>
          <div className="flex items-center gap-4">
            {isPolling && (
              <span className="flex items-center gap-1 text-[var(--brand)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)] animate-pulse" />
                检查中...
              </span>
            )}
            <span className="text-[var(--text-t)]">
              {lastCrawlTime 
                ? new Date(lastCrawlTime).toLocaleDateString("zh-CN") + " 更新"
                : meta?.fetchedAt 
                  ? new Date(meta.fetchedAt).toLocaleDateString("zh-CN") + " 更新"
                  : ""
              }
            </span>
            <span className="text-[var(--text-t)] font-medium">Made by Lin</span>
          </div>
        </div>
      </footer>

      <PrefsPanel
        open={prefsOpen}
        prefs={prefs}
        onSave={(p) => {
          setPrefs(p);
          savePrefs(p);
          setPage(1);
          if (p.skills?.length || p.targetRoles?.length || p.resumeKeywords?.length) {
            setFilter((f) => ({ ...f, sort: "aiMatch" as const }));
          }
        }}
        onClose={() => setPrefsOpen(false)}
      />
      <WeeklyPlan
        open={weeklyOpen}
        onClose={() => setWeeklyOpen(false)}
        jobs={jobs}
        prefs={prefs}
        tracking={tracking}
      />
      <CompareBar
        jobs={compareIds.map((id) => jobs.find((j) => j.id === id)!).filter(Boolean)}
        onRemove={(id) => setCompareIds((p) => p.filter((x) => x !== id))}
        onCompare={() => setCompareOpen(true)}
        onClear={() => setCompareIds([])}
      />
      <ComparePanel
        open={compareOpen}
        jobs={compareIds.map((id) => jobs.find((j) => j.id === id)!).filter(Boolean)}
        prefs={prefs}
        onClose={() => setCompareOpen(false)}
      />
    </>
  );
}

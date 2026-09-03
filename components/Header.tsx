"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { hasPrefs } from "@/lib/ranking";
import { loadPrefs, savePrefs } from "@/lib/prefs";
import { readString, writeString } from "@/lib/safeStorage";

function CrawlButton() {
  const [isCrawling, setIsCrawling] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleCrawl() {
    if (isCrawling) return;
    
    setIsCrawling(true);
    setStatus("loading");
    setMessage("正在爬取数据，预计需要 1-3 分钟...");

    try {
      const res = await fetch("/api/crawl", { method: "POST" });
      const data = await res.json();

      if (data.ok) {
        localStorage.setItem("career-search:last-crawl", new Date().toISOString());
        setStatus("success");
        setMessage(`✓ ${data.message}`);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setStatus("error");
        setMessage(`✗ ${data.error}`);
      }
    } catch (err) {
      setStatus("error");
      setMessage("请求失败");
    } finally {
      setIsCrawling(false);
    }
  }

  return (
    <div className="relative group">
      <button
        onClick={handleCrawl}
        disabled={isCrawling}
        className={`w-8 h-8 rounded-md flex items-center justify-center transition ${
          isCrawling 
            ? "text-[var(--warning)] bg-[var(--warning-light)] cursor-not-allowed" 
            : "text-[var(--text-tertiary)] hover:text-[var(--brand)] hover:bg-[var(--brand-light)]"
        }`}
        title="爬取最新数据"
      >
        {isCrawling ? (
          <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
            <path d="M21 3v5h-5" />
          </svg>
        )}
      </button>
      
      {status !== "idle" && (
        <div className={`absolute right-0 top-12 w-64 p-3 rounded-lg border shadow-lg z-50 ${
          status === "loading" ? "bg-[var(--warning-light)] border-[var(--warning)]/20" :
          status === "success" ? "bg-[var(--success-light)] border-[var(--success)]/20" :
          "bg-[var(--error-light)] border-[var(--error)]/20"
        }`}>
          <p className={`text-xs font-medium ${
            status === "loading" ? "text-[var(--warning)]" :
            status === "success" ? "text-[var(--success)]" :
            "text-[var(--error)]"
          }`}>
            {message}
          </p>
          {status === "loading" && (
            <div className="mt-2 h-1 bg-[var(--border)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--warning)] animate-pulse rounded-full" style={{ width: "60%" }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotifyBell() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const prefs = loadPrefs();
    setEmail(prefs.notifyEmail ?? "");
    setEnabled(prefs.notifyEnabled ?? false);
  }, []);

  function save() {
    const prefs = loadPrefs();
    const updated = { ...prefs, notifyEmail: email, notifyEnabled: enabled };
    savePrefs(updated);
    setSaved(true);
    setTimeout(() => { setSaved(false); setOpen(false); }, 1500);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`w-8 h-8 rounded-md flex items-center justify-center transition ${enabled ? "text-[var(--brand)] bg-[var(--brand-light)]" : "text-[var(--text-tertiary)] hover:text-[var(--brand)] hover:bg-[var(--brand-light)]"}`}
        title="邮件推送设置"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {enabled && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--brand)]" />}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-72 card p-4 z-50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--text)]">每日岗位推送</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="accent-[var(--brand)]" />
              <span className="text-xs text-[var(--text-secondary)]">{enabled ? "开" : "关"}</span>
            </label>
          </div>
          {enabled && (
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="输入接收邮箱"
              className="w-full px-3 py-2 rounded-md border border-[var(--border)] text-sm"
            />
          )}
          <button onClick={save} className="w-full py-2 rounded-md text-xs font-medium text-[var(--text-inverse)] bg-[var(--brand)] hover:bg-[var(--brand-dark)] transition">
            {saved ? "已保存 ✓" : "保存"}
          </button>
          <p className="text-[10px] text-[var(--text-tertiary)]">每天早上推送与你画像匹配的新增岗位，可随时关闭。</p>
        </div>
      )}
    </div>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = readString("theme");
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDark(true);
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    writeString("theme", next ? "dark" : "light");
  }

  return (
    <button onClick={toggle} className="w-8 h-8 rounded-md flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--brand)] hover:bg-[var(--brand-light)] transition" title={dark ? "切换亮色" : "切换暗色"}>
      {dark ? "☀" : "☾"}
    </button>
  );
}

export default function Header({
  total,
  onOpenPrefs,
  onOpenWeekly,
}: {
  total: number;
  onOpenPrefs?: () => void;
  onOpenWeekly?: () => void;
}) {
  const pathname = usePathname();
  const [hasProfile, setHasProfile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const p = loadPrefs();
    setHasProfile(hasPrefs(p));
  }, []);

  const navItems = [
    { label: hasProfile ? "画像" : "建立画像", href: "/profile/", highlight: !hasProfile },
    { label: "求职报告", href: "/report/" },
    { label: "AI 工具", href: "/skills/" },
    { label: "投递 & 面试", href: "/timeline/" },
    { label: "宣讲活动", href: "/events/" },
  ];

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href.replace(/\/$/, ""));
  }

  return (
    <header className="sticky top-0 z-40 bg-[var(--surface)]/95 backdrop-blur-sm border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-[var(--brand)] grid place-items-center shadow-[var(--shadow-sm)] group-hover:shadow-[var(--shadow-md)] transition">
            <span className="text-sm font-bold text-[var(--text-inverse)]">A</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold tracking-tight text-[var(--text)] group-hover:text-[var(--brand)] transition leading-tight">Ai Job Search</span>
            <span className="text-[10px] text-[var(--text-tertiary)] leading-tight">智能求职平台</span>
          </div>
        </a>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-[11px] font-medium font-mono text-[var(--brand)] bg-[var(--brand-light)] px-2.5 py-1 rounded-md">
            {total.toLocaleString()} 岗位
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 text-sm">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <a key={item.label} href={item.href} className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition ${active ? "bg-[var(--brand)] text-[var(--text-inverse)]" : item.highlight ? "text-[var(--brand)] bg-[var(--brand-light)]" : "text-[var(--text-secondary)] hover:text-[var(--brand)] hover:bg-[var(--brand-light)]"}`}>{item.label}</a>
            );
          })}
          <div className="w-px h-5 bg-[var(--border)] mx-1" />
          <a href="/settings/" className="w-8 h-8 rounded-md flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--brand)] hover:bg-[var(--brand-light)] transition" title="AI 设置">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </a>
          <CrawlButton />
          <NotifyBell />
          <ThemeToggle />
        </nav>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button onClick={() => setMenuOpen(!menuOpen)} className="w-8 h-8 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--brand-light)]">
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <a key={item.label} href={item.href} className={`block py-2.5 px-3 rounded-md text-sm font-medium transition ${active ? "bg-[var(--brand)] text-[var(--text-inverse)]" : "text-[var(--text)] hover:text-[var(--brand)] hover:bg-[var(--brand-light)]"}`} onClick={() => setMenuOpen(false)}>{item.label}</a>
            );
          })}
          <a href="/settings/" className={`block py-2.5 px-3 rounded-md text-sm font-medium transition ${isActive("/settings/") ? "bg-[var(--brand)] text-[var(--text-inverse)]" : "text-[var(--text)] hover:text-[var(--brand)] hover:bg-[var(--brand-light)]"}`} onClick={() => setMenuOpen(false)}>AI 设置</a>
          <button
            onClick={() => {
              setMenuOpen(false);
              fetch("/api/crawl", { method: "POST" }).then(() => window.location.reload());
            }}
            className="block w-full text-left py-2.5 px-3 rounded-md text-sm font-medium text-[var(--text)] hover:text-[var(--brand)] hover:bg-[var(--brand-light)] transition"
          >
            爬取最新数据
          </button>
        </div>
      )}
    </header>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  AI_PROVIDERS,
  getSettings,
  saveSettings,
  type AiProvider,
  type AiSettings,
} from "@/lib/deepseek";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AiSettings>({ provider: "deepseek", apiKey: "" });
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [testMsg, setTestMsg] = useState("");

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const provider = AI_PROVIDERS.find((p) => p.id === settings.provider) ?? AI_PROVIDERS[0];

  function handleSave() {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleTest() {
    if (!settings.apiKey) {
      setTestStatus("error");
      setTestMsg("请先填写 API Key");
      return;
    }
    setTestStatus("loading");
    setTestMsg("测试中...");
    try {
      const res = await fetch("/api/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: settings.provider,
          apiKey: settings.apiKey,
          model: settings.model || provider.defaultModel,
        }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (data.ok) {
        setTestStatus("ok");
        setTestMsg("连接成功！Key 有效");
      } else {
        setTestStatus("error");
        setTestMsg(data.error ?? "连接失败");
      }
    } catch {
      setTestStatus("error");
      setTestMsg("网络错误");
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[var(--surface-solid)]/60 border-b border-black/5">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <a href="/" className="text-[15px] font-bold text-[var(--text)] hover:text-brand-500 transition">
            ← 返回首页
          </a>
          <h1 className="text-[15px] font-bold text-[var(--text)]">AI 设置</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Provider */}
        <div className="card p-6 space-y-4">
          <h2 className="text-base font-bold text-[var(--text)]">模型提供商</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AI_PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  const newProvider = p;
                  setSettings((s) => ({
                    ...s,
                    provider: newProvider.id,
                    model: newProvider.defaultModel,
                  }));
                }}
                className={`p-3 rounded-[var(--radius-xs)] border text-left transition ${
                  settings.provider === p.id
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-950/30"
                    : "border-[var(--border-s)] hover:border-[var(--border)]"
                }`}
              >
                <div className="text-sm font-semibold text-[var(--text)]">{p.name}</div>
                <div className="text-[11px] text-[var(--text-s)] mt-0.5">
                  {p.models.length} 个模型
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Model */}
        <div className="card p-6 space-y-4">
          <h2 className="text-base font-bold text-[var(--text)]">选择模型</h2>
          <div className="space-y-2">
            {provider.models.map((m) => (
              <label
                key={m.id}
                className={`flex items-center gap-3 p-3 rounded-[var(--radius-xs)] border cursor-pointer transition ${
                  (settings.model || provider.defaultModel) === m.id
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-950/30"
                    : "border-[var(--border-s)] hover:border-[var(--border)]"
                }`}
              >
                <input
                  type="radio"
                  name="model"
                  value={m.id}
                  checked={(settings.model || provider.defaultModel) === m.id}
                  onChange={() => setSettings((s) => ({ ...s, model: m.id }))}
                  className="accent-[var(--brand)]"
                />
                <div>
                  <div className="text-sm font-medium text-[var(--text)]">{m.name}</div>
                  <div className="text-[11px] text-[var(--text-s)]">{m.id}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* API Key */}
        <div className="card p-6 space-y-4">
          <h2 className="text-base font-bold text-[var(--text)]">API Key</h2>
          <p className="text-xs text-[var(--text-s)]">
            你的 Key 仅保存在浏览器本地，不会上传到任何服务器。
          </p>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={settings.apiKey}
              onChange={(e) => setSettings((s) => ({ ...s, apiKey: e.target.value }))}
              placeholder="sk-..."
              className="w-full px-4 py-2.5 pr-20 rounded-[var(--radius-xs)] border border-[var(--border-s)] text-sm font-mono focus:outline-none focus:border-brand-500"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-s)] hover:text-brand-500 transition"
            >
              {showKey ? "隐藏" : "显示"}
            </button>
          </div>
          {settings.apiKey && (
            <p className="text-[11px] text-[var(--text-t)] font-mono">
              当前存储：{settings.apiKey.slice(0, 7)}...{settings.apiKey.slice(-4)}（共 {settings.apiKey.length} 字符）
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-[var(--radius-xs)] text-sm font-medium bg-brand-500 text-white hover:bg-brand-600 transition"
            >
              {saved ? "已保存 ✓" : "保存"}
            </button>
            <button
              onClick={handleTest}
              disabled={testStatus === "loading"}
              className="px-5 py-2 rounded-[var(--radius-xs)] text-sm font-medium border border-[var(--border-s)] text-[var(--text)] hover:border-brand-500 transition disabled:opacity-50"
            >
              {testStatus === "loading" ? "测试中..." : "测试连接"}
            </button>
          </div>
          {testStatus !== "idle" && testStatus !== "loading" && (
            <p className={`text-xs ${testStatus === "ok" ? "text-green-600" : "text-red-500"}`}>
              {testMsg}
            </p>
          )}
        </div>

        {/* Quick setup guides */}
        <div className="card p-6 space-y-3">
          <h2 className="text-base font-bold text-[var(--text)]">获取 API Key</h2>
          <div className="space-y-2 text-sm text-[var(--text-s)]">
            <a
              href="https://platform.deepseek.com/api_keys"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 rounded hover:bg-[var(--surface)] transition"
            >
              <span className="text-[var(--brand)]">→</span> DeepSeek：platform.deepseek.com
            </a>
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 rounded hover:bg-[var(--surface)] transition"
            >
              <span className="text-[var(--brand)]">→</span> OpenAI：platform.openai.com
            </a>
            <a
              href="https://dashscope.console.aliyun.com/apiKey"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 rounded hover:bg-[var(--surface)] transition"
            >
              <span className="text-[var(--brand)]">→</span> 通义千问：dashscope.console.aliyun.com
            </a>
            <a
              href="https://open.bigmodel.cn/usercenter/apikeys"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 rounded hover:bg-[var(--surface)] transition"
            >
              <span className="text-[var(--brand)]">→</span> 智谱 AI：open.bigmodel.cn
            </a>
            <a
              href="https://platform.moonshot.cn/console/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 rounded hover:bg-[var(--surface)] transition"
            >
              <span className="text-[var(--brand)]">→</span> Moonshot：platform.moonshot.cn
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

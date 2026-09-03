"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface DataInfo {
  ok: boolean;
  count: number;
  fetchedAt: string | null;
  timestamp: number;
}

interface UseDataPollingOptions {
  interval?: number; // 轮询间隔（毫秒），默认 5 分钟
  enabled?: boolean; // 是否启用轮询
  onUpdate?: (data: DataInfo) => void; // 数据更新回调
}

const STORAGE_KEY = "career-search:last-seen-timestamp";

export function useDataPolling(options: UseDataPollingOptions = {}) {
  const { interval = 5 * 60 * 1000, enabled = true, onUpdate } = options;
  const [lastData, setLastData] = useState<DataInfo | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  // 初始化：从 localStorage 读取上次看到的时间戳
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      lastTimestampRef.current = parseInt(saved, 10);
    }
  }, []);

  const checkForUpdate = useCallback(async () => {
    try {
      setIsPolling(true);
      setError(null);

      const response = await fetch("/api/data");
      if (!response.ok) {
        throw new Error("Failed to fetch data info");
      }

      const data: DataInfo = await response.json();
      
      // 检查是否有新数据
      if (lastTimestampRef.current !== null && data.timestamp > lastTimestampRef.current) {
        setHasUpdate(true);
        onUpdate?.(data);
      }

      // 更新时间戳
      lastTimestampRef.current = data.timestamp;
      localStorage.setItem(STORAGE_KEY, data.timestamp.toString());
      
      setLastData(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsPolling(false);
    }
  }, [onUpdate]);

  // 初始检查
  useEffect(() => {
    if (enabled) {
      checkForUpdate();
    }
  }, [enabled, checkForUpdate]);

  // 定时轮询
  useEffect(() => {
    if (!enabled || interval <= 0) return;

    const timer = setInterval(() => {
      checkForUpdate();
    }, interval);

    return () => clearInterval(timer);
  }, [enabled, interval, checkForUpdate]);

  // 手动刷新
  const refresh = useCallback(() => {
    setHasUpdate(false);
    checkForUpdate();
  }, [checkForUpdate]);

  // 忽略更新
  const dismissUpdate = useCallback(() => {
    setHasUpdate(false);
    // 保存当前时间戳，这样刷新后不会再次提示
    if (lastTimestampRef.current) {
      localStorage.setItem(STORAGE_KEY, lastTimestampRef.current.toString());
    }
  }, []);

  return {
    lastData,
    hasUpdate,
    isPolling,
    error,
    refresh,
    dismissUpdate,
  };
}

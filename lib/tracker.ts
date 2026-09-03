import { readJson, writeJson } from "./safeStorage";

export type TrackingStatus = "saved" | "applied" | "written" | "interview" | "hr" | "offer" | "rejected" | "withdrawn";

export interface TrackingEntry {
  status: TrackingStatus;
  updatedAt: string;
  appliedAt?: string;
  interviewAt?: string;
  offerAt?: string;
  notes?: string;
  channel?: string;
  contact?: string;
  salary?: string;
  priority?: "high" | "medium" | "low";
}

export type TrackingData = Record<string, TrackingEntry>;

const CACHE_KEY = "career-search:tracking";

function getCache(): TrackingData {
  return readJson<TrackingData>(CACHE_KEY, {});
}

function setCache(data: TrackingData) {
  writeJson(CACHE_KEY, data);
}

export async function loadTracking(): Promise<TrackingData> {
  return getCache();
}

export async function saveTracking(jobId: string, status: TrackingStatus, extra?: Partial<TrackingEntry>): Promise<TrackingData> {
  const data = getCache();
  const entry: TrackingEntry = { ...data[jobId], ...extra, status, updatedAt: new Date().toISOString() };
  data[jobId] = entry;
  setCache(data);
  return data;
}

export async function removeTracking(jobId: string): Promise<TrackingData> {
  const data = getCache();
  delete data[jobId];
  setCache(data);
  return data;
}

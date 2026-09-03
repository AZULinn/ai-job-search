import { readJson, writeJson } from "./safeStorage";

export interface InterviewRound {
  id: string;
  round: string;
  date: string;
  interviewer?: string;
  duration?: number;
  questions: string[];
  myAnswers?: string[];
  feeling: "好" | "一般" | "差" | "";
  feedback?: string;
  nextPrepare?: string;
  result: "通过" | "待定" | "挂了" | "";
}

export type InterviewStatus = "已投递" | "进行中" | "已拿offer" | "已拒" | "已放弃";

export interface InterviewRecord {
  id: string;
  company: string;
  position: string;
  department?: string;
  channel?: string;
  status: InterviewStatus;
  rounds: InterviewRound[];
  salaryInfo?: string;
  offerDetail?: string;
  nextInterviewAt?: string;
  nextPrepare?: string;
  notes?: string;
  relatedJobId?: string;
  createdAt: string;
  updatedAt: string;
}

const CACHE_KEY = "career-search:interviews";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getCache(): InterviewRecord[] {
  return readJson<InterviewRecord[]>(CACHE_KEY, []);
}

function setCache(data: InterviewRecord[]) {
  writeJson(CACHE_KEY, data);
}

export async function loadInterviews(): Promise<InterviewRecord[]> {
  return getCache();
}

export async function saveInterview(record: Omit<InterviewRecord, "id" | "createdAt" | "updatedAt">): Promise<InterviewRecord[]> {
  const now = new Date().toISOString();
  const newRecord: InterviewRecord = {
    ...record,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };

  const data = getCache();
  data.unshift(newRecord);
  setCache(data);

  return data;
}

export async function updateInterview(id: string, patch: Partial<Omit<InterviewRecord, "id" | "createdAt">>): Promise<InterviewRecord[]> {
  const data = getCache();
  const idx = data.findIndex((r) => r.id === id);
  if (idx === -1) return data;

  const now = new Date().toISOString();
  data[idx] = { ...data[idx], ...patch, updatedAt: now };
  setCache(data);

  return data;
}

export async function deleteInterview(id: string): Promise<InterviewRecord[]> {
  let data = getCache();
  data = data.filter((r) => r.id !== id);
  setCache(data);

  return data;
}

export function createEmptyRound(): InterviewRound {
  return {
    id: generateId(),
    round: "",
    date: new Date().toISOString().slice(0, 10),
    questions: [],
    feeling: "",
    result: "",
  };
}

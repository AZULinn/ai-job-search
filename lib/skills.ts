import { callDeepSeek, RESUME_POLISH_PROMPT, RESUME_OPTIMIZE_PROMPT, INTERVIEW_PROMPT, INTERVIEW_FOLLOWUP_PROMPT, COVER_LETTER_PROMPT, COVER_LETTER_REFINE_PROMPT, RESUME_REFINE_PROMPT, OFFER_COMPARE_PROMPT, JD_MATCH_PROMPT, CUSTOM_RESUME_PROMPT, JD_COMPARE_PROMPT, DIRECTION_TEMPLATE_PROMPT, PROGRESS_ANALYZE_PROMPT, COACH_PROMPT } from "./deepseek";

export interface InterviewQuestion {
  question: string;
  category: string;
  difficulty: string;
  tips: string;
  sample: string;
}

export interface ResumePolishResult {
  suggestions: { original: string; improved: string; reason: string }[];
  overall: string;
  keywords: string[];
  score: number;
  scoreReason: string;
}

export interface ResumeOptimizeSuggestion {
  id: number;
  section: string;
  title: string;
  impact: string;
  tags: string[];
  original: string;
  improved: string;
  reason: string;
}

export interface ResumeOptimizeResult {
  originalScore: number;
  optimizedScore: number;
  suggestions: ResumeOptimizeSuggestion[];
  resumeOriginal: { sections: { title: string; content: string }[] };
  resume: { sections: { title: string; content: string }[] };
  directionAdvice?: {
    skillsRequired: string[];
    skillsBonus: string[];
    keyMetrics: string[];
    commonMistakes: string[];
  };
  keywords: string[];
  tips: string;
}

export interface CoverLetterResult {
  letter: string;
  highlights: string[];
  tips: string;
  changes?: string;
}

export interface OfferCompareResult {
  comparison: { dimension: string; analysis: string }[];
  recommendation: string;
  reason: string;
  risks: string;
  negotiation: string;
}

export interface JdMatchResult {
  matchScore: number;
  modules: { name: string; score: number; matched: string[]; missing: string[] }[];
  jdKeywords: string[];
  matchedKeywords: string[];
  suggestions: string[];
}

export interface CustomResumeResult {
  sections: { title: string; content: string }[];
  highlights: string[];
  keywordCoverage: number;
  tips: string;
}

export interface JdCompareResult {
  rankings: { rank: number; company: string; position: string; score: number; strengths: string[]; weaknesses: string[]; priority: string }[];
  strategy: string;
  timeline: string;
}

export interface DirectionTemplateResult {
  direction: string;
  overview: string;
  template: {
    objective: string;
    skillsRequired: string[];
    skillsBonus: string[];
    experienceTemplate: { type: string; example: string }[];
    educationFocus: string;
    selfIntro: string;
  };
  keyMetrics: string[];
  commonMistakes: string[];
  interviewFocus: string[];
  relatedDirections: string[];
}

export interface ProgressAnalyzeResult {
  summary: string;
  insights: string[];
  suggestions: string[];
  riskWarnings: string[];
  weeklyPlan: string;
}

export function analyzeProgress(stats: string) {
  return callDeepSeek<ProgressAnalyzeResult>(PROGRESS_ANALYZE_PROMPT, stats, 2000);
}

export function generateInterview(profile: string, job: string) {
  return callDeepSeek<{ questions: InterviewQuestion[] }>(INTERVIEW_PROMPT,
    `候选人背景：\n${profile}\n\n目标岗位：\n${job}`, 3000);
}

export function followupInterview(profile: string, job: string, previous: string, followup: string) {
  const recentPrevious = previous.split("\n").slice(-20).join("\n");
  return callDeepSeek<{ questions: InterviewQuestion[] }>(INTERVIEW_FOLLOWUP_PROMPT,
    `用户追问：\n${followup}\n\n候选人背景：\n${profile}\n\n目标岗位：\n${job}\n\n已有题目（最近）：\n${recentPrevious}`, 3000);
}

export function polishResume(profile: string, job: string, experiences: string) {
  return callDeepSeek<ResumePolishResult>(RESUME_POLISH_PROMPT,
    `候选人画像：\n${profile}\n\n目标岗位：\n${job}\n\n现有经历描述：\n${experiences}`, 3000);
}

export function optimizeResume(profile: string, job: string, experiences: string) {
  return callDeepSeek<ResumeOptimizeResult>(RESUME_OPTIMIZE_PROMPT,
    `候选人画像：\n${profile}\n\n目标岗位 JD：\n${job}\n\n现有经历描述：\n${experiences}`, 8000);
}

export function generateCoverLetter(profile: string, job: string) {
  return callDeepSeek<CoverLetterResult>(COVER_LETTER_PROMPT,
    `候选人画像：\n${profile}\n\n目标岗位：\n${job}`, 2000);
}

export function refineCoverLetter(profile: string, job: string, letter: string, instruction: string) {
  return callDeepSeek<CoverLetterResult>(COVER_LETTER_REFINE_PROMPT,
    `候选人画像：\n${profile}\n\n目标岗位：\n${job}\n\n当前求职信：\n${letter}\n\n修改指令：\n${instruction}`, 2000);
}

export function compareOffers(profile: string, offers: string) {
  return callDeepSeek<OfferCompareResult>(OFFER_COMPARE_PROMPT,
    `候选人背景：\n${profile}\n\n待对比的 Offer：\n${offers}`, 3000);
}

export function analyzeJdMatch(profile: string, job: string) {
  return callDeepSeek<JdMatchResult>(JD_MATCH_PROMPT,
    `候选人画像：\n${profile}\n\n目标岗位 JD：\n${job}`, 3000);
}

export function generateCustomResume(profile: string, job: string, experiences: string) {
  return callDeepSeek<CustomResumeResult>(CUSTOM_RESUME_PROMPT,
    `候选人画像：\n${profile}\n\n目标岗位 JD：\n${job}\n\n现有经历描述：\n${experiences}`, 4000);
}

export function compareJds(profile: string, jobs: string) {
  return callDeepSeek<JdCompareResult>(JD_COMPARE_PROMPT,
    `候选人画像：\n${profile}\n\n待对比的岗位（用 --- 分隔）：\n${jobs}`, 4000);
}

export function getDirectionTemplate(profile: string, direction: string) {
  return callDeepSeek<DirectionTemplateResult>(DIRECTION_TEMPLATE_PROMPT,
    `候选人画像：\n${profile}\n\n目标求职方向：\n${direction}`, 4000);
}

export interface ResumeRefineResult {
  sections: { title: string; content: string }[];
  changes: string;
}

export function refineResume(profile: string, job: string, resume: string, instruction: string) {
  return callDeepSeek<ResumeRefineResult>(RESUME_REFINE_PROMPT,
    `候选人画像：\n${profile}\n\n目标岗位：\n${job}\n\n当前简历：\n${resume}\n\n修改指令：\n${instruction}`, 3000);
}

export interface CoachAdviceResult {
  urgent: { title: string; reason: string; action: string; daysLeft?: number }[];
  insights: { metric: string; value: string; trend: string; suggestion: string }[];
  recommended: { company: string; title: string; matchScore: number; reason: string }[];
  funnel: { applied: number; written: number; interview: number; offer: number };
  weeklyPlan: string;
  oneLineSummary: string;
}

export function fetchCoachAdvice(payload: { profile: string; tracking: string; interviews: string; newJobs: string; today: string }) {
  return callDeepSeek<CoachAdviceResult>(COACH_PROMPT,
    `当前日期：${payload.today}\n\n候选人画像：\n${payload.profile}\n\n投递记录：\n${payload.tracking}\n\n面试记录：\n${payload.interviews}\n\n近期新岗位：\n${payload.newJobs}`, 3000);
}
